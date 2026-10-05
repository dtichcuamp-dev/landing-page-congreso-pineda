import { Footer } from "@/components/layout/Footer";
import { FloatingCTA } from "@/components/layout/FloatingCTA";
import { Navbar } from "@/components/layout/Navbar";
import { About } from "@/components/sections/About";
import { Agenda } from "@/components/sections/Agenda";
import { Hero } from "@/components/sections/Hero";
import { Highlights } from "@/components/sections/Highlights";
import { Registration } from "@/components/sections/Registration";
import { Specialties } from "@/components/sections/Specialties";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Highlights />
        <Specialties />
        <Agenda />
        <Registration />
      </main>
      <Footer />
      <FloatingCTA />
    </>
  );
}
