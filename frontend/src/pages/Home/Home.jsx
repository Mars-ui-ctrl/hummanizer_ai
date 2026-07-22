import { Link } from 'react-router-dom';
import methods from '../../config/methods';
import './Home.css';

function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="home-hero">
        <span className="home-badge">✦ AI-Powered Writing Refinement</span>
        <h1 className="home-title">
          Refine Your Writing
          <br />
          with <span className="home-title-gradient">AI Precision</span>
        </h1>
        <p className="home-subtitle">
          Upload a document or paste your text, choose a rewriting strategy, and
          get polished, professional results in seconds.
        </p>
        <div className="home-cta">
          <Link to="/method1" className="btn-primary home-cta-btn">
            <span>Get Started →</span>
          </Link>
        </div>
      </section>

      {/* Methods */}
      <section className="home-methods">
        <h2 className="home-methods-title">Rewriting Methods</h2>
        <p className="home-methods-subtitle">
          Five distinct strategies to refine your text
        </p>
        <div className="home-methods-grid">
          {methods.map((method) => (
            <Link
              key={method.id}
              to={method.path}
              className="home-method-card glass-card"
            >
              <div className="home-method-icon">{method.icon}</div>
              <span className="home-method-subtitle">{method.subtitle}</span>
              <span className="home-method-name">{method.name}</span>
              <span className="home-method-desc">{method.description}</span>
              <span className="home-method-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="home-steps">
        <h2 className="home-steps-title">How It Works</h2>
        <div className="home-steps-list">
          <div className="home-step">
            <span className="home-step-number">1</span>
            <div className="home-step-content">
              <p className="home-step-title">Upload or Paste</p>
              <p className="home-step-desc">
                Upload a PDF document or paste your text directly into the
                editor.
              </p>
            </div>
          </div>
          <div className="home-step">
            <span className="home-step-number">2</span>
            <div className="home-step-content">
              <p className="home-step-title">Choose a Method</p>
              <p className="home-step-desc">
                Select one of the five rewriting strategies from the sidebar.
              </p>
            </div>
          </div>
          <div className="home-step">
            <span className="home-step-number">3</span>
            <div className="home-step-content">
              <p className="home-step-title">AI Rewrites</p>
              <p className="home-step-desc">
                The AI processes your text and generates a refined version in
                seconds.
              </p>
            </div>
          </div>
          <div className="home-step">
            <span className="home-step-number">4</span>
            <div className="home-step-content">
              <p className="home-step-title">Copy or Download</p>
              <p className="home-step-desc">
                Copy the result to your clipboard or download it as PDF, DOCX,
                or TXT.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
