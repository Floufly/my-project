import { scanCity } from './scanner';
import { getBusinessesWithoutSite } from './scanner-db';
import { generateSiteData } from './site-generator';
import { createSite, getSiteByPlaceId } from './sites-db';
import { updateBusinessStatus } from './scanner-db';
import { contactBusiness } from './notifier';
import { getAgentState, updateAgentState, addLog } from './agent-db';

export type AgentEvent = {
  type: 'log' | 'state' | 'done' | 'error';
  data: Record<string, unknown>;
};

// Global flag to allow external stop signal
let stopRequested = false;

export function requestStop() {
  stopRequested = true;
}

export function isRunning() {
  const state = getAgentState();
  return state.status === 'running';
}

function log(level: AgentLog['level'], step: string, message: string, emit: (e: AgentEvent) => void) {
  addLog({ level, step, message });
  emit({ type: 'log', data: { level, step, message, createdAt: new Date().toISOString() } });
}

type AgentLog = { level: 'info' | 'success' | 'warning' | 'error'; step: string; message: string };

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runAgentCycle(emit: (e: AgentEvent) => void): Promise<void> {
  stopRequested = false;

  const state = getAgentState();
  const { config } = state;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    log('error', 'init', 'GOOGLE_MAPS_API_KEY manquante dans .env.local', emit);
    updateAgentState({ status: 'error', currentStep: null });
    emit({ type: 'error', data: { message: 'GOOGLE_MAPS_API_KEY manquante' } });
    return;
  }

  updateAgentState({ status: 'running', lastRunAt: new Date().toISOString(), currentStep: 'Démarrage' });
  emit({ type: 'state', data: { status: 'running' } });

  log('info', 'init', `Agent démarré — ${config.cities.length} villes, ${config.categories.length} catégories`, emit);

  let totalScanned = state.totalScanned;
  let totalGenerated = state.totalGenerated;
  let totalContacted = state.totalContacted;

  // ── STEP 1 : SCAN ────────────────────────────────────────────────────────────
  for (const city of config.cities) {
    if (stopRequested) break;

    const step = `Scan ${city}`;
    updateAgentState({ currentStep: step });
    log('info', step, `Scan de ${city} en cours...`, emit);

    try {
      const result = await scanCity(city, config.categories, apiKey, (progress) => {
        if (progress.processed % 5 === 0) {
          emit({ type: 'log', data: { level: 'info', step, message: `${city} — ${progress.category}: ${progress.processed}/${progress.total} traités`, createdAt: new Date().toISOString() } });
        }
      });

      totalScanned += result.found;
      updateAgentState({ totalScanned });
      log('success', step, `${city} : ${result.found} commerces trouvés, ${result.noWebsite} sans site web`, emit);
    } catch (err) {
      log('error', step, `Erreur scan ${city}: ${err instanceof Error ? err.message : String(err)}`, emit);
    }

    await sleep(1000);
  }

  // ── STEP 2 : GENERATE SITES ──────────────────────────────────────────────────
  if (!stopRequested) {
    updateAgentState({ currentStep: 'Génération des sites' });
    log('info', 'generate', 'Génération des sites pour les commerces sans site web...', emit);

    const businesses = getBusinessesWithoutSite(undefined, config.maxBusinessesPerRun);
    let generated = 0;

    for (const business of businesses) {
      if (stopRequested) break;

      const existing = getSiteByPlaceId(business.placeId);
      if (existing) continue;

      try {
        const siteData = generateSiteData(business);
        createSite(siteData);
        updateBusinessStatus(business.placeId, 'site_generated', `/sites/${siteData.slug}`);
        generated++;
        totalGenerated++;
        updateAgentState({ totalGenerated });
        log('success', 'generate', `Site créé : ${business.name} → /sites/${siteData.slug}`, emit);
      } catch (err) {
        log('error', 'generate', `Erreur site pour ${business.name}: ${err instanceof Error ? err.message : String(err)}`, emit);
      }

      await sleep(50);
    }

    log('info', 'generate', `${generated} sites générés au total`, emit);
  }

  // ── STEP 3 : CONTACT ─────────────────────────────────────────────────────────
  if (!stopRequested && config.autoContact && process.env.TWILIO_ACCOUNT_SID) {
    updateAgentState({ currentStep: 'Envoi des SMS' });
    log('info', 'contact', 'Envoi des SMS aux nouveaux commerces...', emit);

    const { getAllSites } = await import('./sites-db');
    const sites = getAllSites(config.maxBusinessesPerRun);
    let contacted = 0;

    for (const site of sites) {
      if (stopRequested) break;
      if (!site.phone) continue;

      // Only contact businesses with status site_generated (not already contacted)
      const { getBusinessesWithoutSite: getBiz } = await import('./scanner-db');
      const biz = getBiz().find((b) => b.placeId === site.placeId && b.status === 'site_generated');
      if (!biz) continue;

      try {
        const results = await contactBusiness(site, ['sms']);
        if (results.some((r) => r.success)) {
          contacted++;
          totalContacted++;
          updateAgentState({ totalContacted });
          log('success', 'contact', `SMS envoyé à ${site.businessName} (${site.phone})`, emit);
        } else {
          log('warning', 'contact', `SMS échoué pour ${site.businessName}: ${results[0]?.error}`, emit);
        }
      } catch (err) {
        log('error', 'contact', `Erreur SMS ${site.businessName}: ${err instanceof Error ? err.message : String(err)}`, emit);
      }

      await sleep(300);
    }

    log('info', 'contact', `${contacted} SMS envoyés`, emit);
  } else if (config.autoContact && !process.env.TWILIO_ACCOUNT_SID) {
    log('warning', 'contact', 'Twilio non configuré — SMS ignorés (ajouter TWILIO_ACCOUNT_SID dans .env)', emit);
  }

  // ── DONE ─────────────────────────────────────────────────────────────────────
  const nextRun = new Date(Date.now() + config.intervalHours * 60 * 60 * 1000).toISOString();
  const finalStatus = stopRequested ? 'paused' : 'idle';
  updateAgentState({ status: finalStatus, currentStep: null, nextRunAt: nextRun });

  log('success', 'done', stopRequested ? 'Agent arrêté manuellement' : `Cycle terminé. Prochain run: ${new Date(nextRun).toLocaleString('fr-FR')}`, emit);
  emit({ type: 'done', data: { status: finalStatus, nextRunAt: nextRun } });
}
