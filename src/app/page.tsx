import { Footer } from "@/components/layout/Footer";
import { FloatingBrochure } from "@/components/layout/FloatingBrochure";
import { FloatingCTA } from "@/components/layout/FloatingCTA";
import { Navbar } from "@/components/layout/Navbar";
import { About } from "@/components/sections/About";
import { Honoree } from "@/components/sections/Honoree";
import { Agenda } from "@/components/sections/Agenda";
import { Hero } from "@/components/sections/Hero";
import { Highlights } from "@/components/sections/Highlights";
import { Gallery } from "@/components/sections/Gallery";
import { Registration } from "@/components/sections/Registration";
import { Speakers } from "@/components/sections/Speakers";
import { Specialties } from "@/components/sections/Specialties";
import { Sponsors } from "@/components/sections/Sponsors";
import { Venue } from "@/components/sections/Venue";
import MaintenancePage from "./mantenimiento/page";
import { IS_MAINTENANCE_ACTIVE } from "@/config/site";

interface PageProps {
  searchParams?: Promise<{ preview?: string }>;
}

export default async function Home(props: PageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const isPreview = searchParams.preview === "pineda2026";

  // Si el modo de mantenimiento está activo y no se usa el token de preview, mostrar pantalla de mantenimiento
  if (IS_MAINTENANCE_ACTIVE && !isPreview) {
    return <MaintenancePage />;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Honoree />
        <Highlights />
        <Gallery />
        <Specialties />
        <Speakers />
        <Agenda />
        <Venue />
        <Registration />
        <Sponsors />
      </main>
      <Footer />
      <FloatingCTA />
      <FloatingBrochure />
    </>
  );
}
