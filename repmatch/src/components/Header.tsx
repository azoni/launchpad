export default function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <img src="/icon.svg" alt="RepMatch icon" className="header-icon" />
        <div className="header-text">
          <h1>RepMatch</h1>
          <p className="tagline">Same effort. Different plates.</p>
        </div>
      </div>
    </header>
  );
}
