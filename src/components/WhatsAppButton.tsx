import { useEffect, useId, useRef, useState } from 'react';
import { ChevronRight, MessageCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WhatsAppButtonProps {
  whatsappUrl: string;
  secondaryWhatsappUrl: string;
}

export function WhatsAppButton({ whatsappUrl, secondaryWhatsappUrl }: WhatsAppButtonProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstContactRef = useRef<HTMLAnchorElement>(null);
  const panelId = useId();
  const titleId = `${panelId}-title`;

  const closePanel = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;

    firstContactRef.current?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleClick = () => {
    setIsHovered(false);
    setIsOpen((open) => !open);
  };

  return (
    <div
      ref={containerRef}
      className="whatsapp-container"
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="whatsapp-float-button"
        aria-label={t('whatsappSupport.open')}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-haspopup="dialog"
      >
        <div className="whatsapp-icon-wrapper">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
            alt="WhatsApp" 
            className="w-7 h-7"
          />
        </div>
        <span className={`whatsapp-tooltip ${isHovered && !isOpen ? 'visible' : ''}`} aria-hidden="true">
          💬 {t('whatsappSupport.needHelp')}
        </span>
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="whatsapp-support-panel"
          role="dialog"
          aria-labelledby={titleId}
        >
          <div className="whatsapp-support-header">
            <h2 id={titleId}>{t('whatsappSupport.chooseService')}</h2>
            <button
              type="button"
              className="whatsapp-support-close"
              onClick={closePanel}
              aria-label={t('close')}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="whatsapp-support-contacts">
            {[whatsappUrl, secondaryWhatsappUrl].map((url, index) => (
              <a
                key={url}
                ref={index === 0 ? firstContactRef : undefined}
                className="whatsapp-support-contact"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closePanel}
              >
                <MessageCircle size={22} aria-hidden="true" />
                <span>{t('whatsappSupport.service', { number: index + 1 })}</span>
                <ChevronRight size={18} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      )}
      
      {/* Rings d'animation */}
      <div className="whatsapp-ring whatsapp-ring-1"></div>
      <div className="whatsapp-ring whatsapp-ring-2"></div>
    </div>
  );
}
