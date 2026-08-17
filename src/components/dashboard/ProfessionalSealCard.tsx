import React from 'react';

type Props={name?:string|null;professionalId?:string|null;className?:string};

const ProfessionalSealCard=({name,professionalId,className=''}:Props)=>{
 const safeName=name?.trim()||'NOMBRE DEL PROFESIONAL';
 const safeId=professionalId?.trim()||'PROF-000000';
 return <div className={`w-full rounded-xl border-2 border-[#167f94] bg-white p-3 shadow-sm ${className}`}>
   <svg viewBox="0 0 900 430" className="w-full h-auto" role="img" aria-label={`Sello profesional ${safeName}`}>
    <defs>
      <linearGradient id="sealCrossGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff"/><stop offset=".48" stopColor="#a9e9ec"/><stop offset="1" stopColor="#edfafd"/></linearGradient>
      <linearGradient id="sealTeal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3e9ab0"/><stop offset="1" stopColor="#2d8da5"/></linearGradient>
    </defs>
    <rect x="8" y="8" width="884" height="414" rx="18" fill="#fff" stroke="#167f94" strokeWidth="5"/>
    <rect x="22" y="22" width="856" height="386" rx="12" fill="none" stroke="#a8cfd5" strokeWidth="2"/>
    <g transform="translate(58 83)">
      <rect x="116" y="0" width="112" height="112" rx="31" fill="url(#sealTeal)"/>
      <path d="M0 116 C0 94 18 76 40 76 H118 C146 76 168 98 168 126 V170 H44 C20 170 0 150 0 126Z" fill="url(#sealCrossGlow)"/>
      <path d="M168 126 C168 98 190 76 218 76 H228 V294 C228 316 210 334 188 334 H168Z" fill="url(#sealCrossGlow)"/>
    </g>
    <g fontFamily="Arial,Helvetica,sans-serif" fill="#123d46">
      <text x="330" y="88" fontSize="25" fontWeight="700" letterSpacing="1.2">REPÚBLICA DE GUINEA ECUATORIAL</text>
      <text x="330" y="124" fontSize="23" fontWeight="700" fill="#167f94">MINISTERIO DE SANIDAD E INFRAESTRUCTURAS SANITARIAS</text>
      <line x1="330" y1="151" x2="835" y2="151" stroke="#b6d6db" strokeWidth="2"/>
      <text x="330" y="194" fontSize="17" fill="#5b747b">SELLO PROFESIONAL SANITARIO</text>
      <text x="330" y="247" fontSize="34" fontWeight="700">{safeName}</text>
      <text x="330" y="292" fontSize="21" fill="#55727a">ID / NÚMERO PROFESIONAL</text>
      <text x="330" y="328" fontSize="30" fontWeight="700" fill="#167f94">{safeId}</text>
      <text x="330" y="366" fontSize="14" fill="#6a8086">Documento oficial · Guinea Ecuatorial Salud</text>
    </g>
   </svg>
 </div>;
};
export default ProfessionalSealCard;
