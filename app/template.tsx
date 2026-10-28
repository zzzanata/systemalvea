// Ao contrário do layout, o template é recriado a cada troca de página:
// por isso a animação de entrada (só opacidade, para não afetar o loading, que é "fixed") roda sempre que o usuário navega.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-gtg-page">{children}</div>;
}
