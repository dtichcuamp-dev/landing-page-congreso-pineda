import { Reveal } from "@/components/ui/Reveal";

// Arreglo de imágenes para el carrusel. 
// Las primeras 4 son imágenes principales; se duplican para lograr el efecto de scroll infinito sin saltos.
// Se usan placeholders de Unsplash relacionados con eventos médicos y conferencias.
const IMAGES = [
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=600&q=80",
];

const CAROUSEL_IMAGES = [...IMAGES, ...IMAGES]; // Duplicamos para el loop continuo

export function Gallery() {
  return (
    <section className="overflow-hidden bg-clinic-50 pb-20 sm:pb-28">
      <Reveal>
        <div className="relative mt-8">
          {/* Sombras difuminadas a los lados para dar un efecto elegante de entrada/salida */}
          <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-clinic-50 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-clinic-50 to-transparent pointer-events-none" />
          
          <div className="flex w-max animate-infinite-scroll gap-4 sm:gap-6 px-4">
            {CAROUSEL_IMAGES.map((src, idx) => (
              <div 
                key={idx} 
                className="relative h-48 w-72 sm:h-64 sm:w-96 flex-none overflow-hidden rounded-3xl shadow-lg border-4 border-white/50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={src} 
                  alt={`Momento del Congreso ${idx}`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* CSS inyectado para la animación de scroll infinito */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes infinite-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 0.5rem)); }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll 25s linear infinite;
        }
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
        @media (min-width: 640px) {
          @keyframes infinite-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-50% - 0.75rem)); }
          }
        }
      `}} />
    </section>
  );
}
