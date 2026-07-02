export default function PageBackground({ imageUrl, children, overlayOpacity = 60 }) {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundColor: '#0d0d0d' // fallback color
      }}
    >
      <div className={`absolute inset-0 bg-black/${overlayOpacity} z-0`}></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}