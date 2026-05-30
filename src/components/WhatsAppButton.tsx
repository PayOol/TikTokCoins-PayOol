import { useState } from 'react';

interface WhatsAppButtonProps {
  whatsappUrl: string;
}

export function WhatsAppButton({ whatsappUrl }: WhatsAppButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="whatsapp-container">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="whatsapp-float-button"
        aria-label="Contacter sur WhatsApp"
      >
        <div className="whatsapp-icon-wrapper">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
            alt="WhatsApp" 
            className="w-7 h-7"
          />
        </div>
        <span className={`whatsapp-tooltip ${isHovered ? 'visible' : ''}`}>
          💬 Besoin d'aide ?
        </span>
      </button>
      
      {/* Rings d'animation */}
      <div className="whatsapp-ring whatsapp-ring-1"></div>
      <div className="whatsapp-ring whatsapp-ring-2"></div>
    </div>
  );
}
