import { FOOTER } from "../config";

/** Faculty details and the rights notice, shown at the bottom of every screen. */
export function Footer() {
  const { enquiries, website } = FOOTER;
  const phoneLink = `tel:${enquiries.phone.replace(/[^+\d]/g, "")}`;

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div>
          <p className="app-footer-name">{FOOTER.faculty}</p>
          <p className="app-footer-text">{FOOTER.institution}</p>
          <address className="app-footer-text app-footer-address">{FOOTER.address}</address>
        </div>

        <div>
          <h2 className="app-footer-heading">{enquiries.label}</h2>
          <ul className="app-footer-list">
            <li>
              <a href={`mailto:${enquiries.email}`}>{enquiries.email}</a>
            </li>
            <li>
              <a href={phoneLink}>{enquiries.phone}</a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="app-footer-heading">{website.label}</h2>
          <ul className="app-footer-list">
            <li>
              <a href={website.href} target="_blank" rel="noopener noreferrer">
                {website.text}
                <span className="app-visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </div>

        <p className="app-footer-legal">
          &copy; {new Date().getFullYear()} {FOOTER.rightsHolder}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
