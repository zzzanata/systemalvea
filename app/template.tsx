// Ao contrário do layout, o template é recriado a cada troca de página:
// por isso a animação de entrada roda sempre que o usuário navega.
// "av-stagger" (em globals.css) faz os blocos da página entrarem em sequência.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-av-page av-stagger">{children}</div>;
}
