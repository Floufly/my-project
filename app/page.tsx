import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { BookingSection } from './components/BookingSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ServicesSection />
      <BookingSection />
      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </main>
  );
}
