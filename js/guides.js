/* Гиды портала: беркут Қыран и снежный барс Ақбарыс (векторные иллюстрации) */
window.GUIDES = {
  eagle: `<svg viewBox="0 0 200 200" class="guide-svg" role="img" aria-label="Беркут Қыран">
  <defs>
    <radialGradient id="eSky" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#9ee3ff"/><stop offset=".6" stop-color="#2f86c9"/><stop offset="1" stop-color="#123c74"/></radialGradient>
    <linearGradient id="eHead" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#f0c069"/><stop offset=".55" stop-color="#c98a35"/><stop offset="1" stop-color="#7a4b1c"/></linearGradient>
    <linearGradient id="eBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6e4422"/><stop offset="1" stop-color="#2c1a0c"/></linearGradient>
    <linearGradient id="eBeak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4a52"/><stop offset="1" stop-color="#151519"/></linearGradient>
    <clipPath id="eClip"><circle cx="100" cy="100" r="96"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#eSky)"/>
  <g clip-path="url(#eClip)">
    <path d="M-5 160 L30 118 L52 136 L84 96 L112 128 L140 104 L170 132 L205 112 L205 205 L-5 205Z" fill="#e9f6ff" opacity=".55"/>
    <path d="M-5 175 L40 140 L75 160 L120 130 L160 158 L205 140 L205 205 L-5 205Z" fill="#bfe2f5" opacity=".6"/>
    <circle cx="40" cy="48" r="14" fill="#ffe08a" opacity=".85"/>
    <path d="M22 205 C26 160 52 132 92 124 C136 116 170 140 182 205Z" fill="url(#eBody)"/>
    <g stroke="#1d1007" stroke-width="2" fill="none" opacity=".55">
      <path d="M60 160 q14 8 26 2"/><path d="M98 156 q14 10 28 2"/><path d="M70 182 q16 8 30 0"/><path d="M112 180 q16 9 32 0"/><path d="M140 160 q10 7 22 3"/>
    </g>
    <path d="M66 146 C56 112 64 74 96 60 C122 49 150 58 160 80 C165 92 162 103 154 109 L134 114 C124 132 112 142 94 148Z" fill="url(#eHead)"/>
    <g stroke="#8a5420" stroke-width="2.2" fill="none" opacity=".6" stroke-linecap="round">
      <path d="M80 92 q-6 12 -4 24"/><path d="M92 104 q-4 14 0 26"/><path d="M106 118 q0 10 4 18"/><path d="M98 76 q-8 6 -12 14"/>
    </g>
    <path d="M150 78 C160 75 168 81 171 89 L157 94 C153 90 150 84 150 78Z" fill="#f4c64a"/>
    <path d="M161 81 C177 80 187 93 183 108 C181 115 174 118 171 111 C173 102 169 95 159 93Z" fill="url(#eBeak)"/>
    <path d="M157 94 L171 92" stroke="#2a1a0a" stroke-width="2" stroke-linecap="round"/>
    <path d="M115 72 C125 64 140 64 149 72 C140 70 128 71 118 78Z" fill="#5a3412"/>
    <circle cx="133" cy="81" r="7.5" fill="#f4a21c"/>
    <circle cx="134" cy="81" r="4" fill="#111"/>
    <circle cx="135.8" cy="79.2" r="1.5" fill="#fff"/>
    <path d="M46 205 C60 178 84 168 100 170" stroke="#e3b55b" stroke-width="4" fill="none" opacity=".9"/>
  </g>
  <circle cx="100" cy="100" r="96" fill="none" stroke="#f8dc94" stroke-width="4"/>
</svg>`,
  leopard: `<svg viewBox="0 0 200 200" class="guide-svg" role="img" aria-label="Снежный барс Ақбарыс">
  <defs>
    <radialGradient id="lSky" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#d9f3ff"/><stop offset=".6" stop-color="#6fb1d6"/><stop offset="1" stop-color="#1f4f7a"/></radialGradient>
    <radialGradient id="lFur" cx=".5" cy=".4" r=".65"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e3e8ec"/><stop offset="1" stop-color="#b9c3cb"/></radialGradient>
    <radialGradient id="lEye" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#d4fff0"/><stop offset=".6" stop-color="#7fcfb8"/><stop offset="1" stop-color="#3d8f7c"/></radialGradient>
    <clipPath id="lClip"><circle cx="100" cy="100" r="96"/></clipPath>
  </defs>
  <circle cx="100" cy="100" r="98" fill="url(#lSky)"/>
  <g clip-path="url(#lClip)">
    <path d="M-5 150 L35 100 L60 124 L100 74 L140 120 L165 98 L205 140 L205 205 L-5 205Z" fill="#f4fbff" opacity=".7"/>
    <path d="M86 92 L100 74 L114 92 L106 88 L100 94 L94 88Z" fill="#fff"/>
    <path d="M30 205 C34 168 60 150 100 150 C140 150 166 168 170 205Z" fill="url(#lFur)"/>
    <g fill="#5d646c" opacity=".8"><circle cx="58" cy="182" r="5"/><circle cx="142" cy="184" r="5"/><circle cx="80" cy="196" r="4"/><circle cx="122" cy="197" r="4"/></g>
    <path d="M52 68 C46 48 60 38 74 48 L78 62Z" fill="#cfd6dc"/><path d="M57 64 C54 52 62 47 70 53 L72 61Z" fill="#8c949c"/>
    <path d="M148 68 C154 48 140 38 126 48 L122 62Z" fill="#cfd6dc"/><path d="M143 64 C146 52 138 47 130 53 L128 61Z" fill="#8c949c"/>
    <path d="M100 52 C142 52 162 80 160 112 C158 146 132 166 100 166 C68 166 42 146 40 112 C38 80 58 52 100 52Z" fill="url(#lFur)"/>
    <g fill="none" stroke="#4d545c" stroke-width="3" stroke-linecap="round" opacity=".85">
      <path d="M78 64 a5 5 0 1 0 8 3"/><path d="M114 66 a5 5 0 1 1 8 -1"/><path d="M98 60 a4 4 0 1 0 6 0"/>
      <path d="M52 100 a6 6 0 1 0 6 8"/><path d="M148 100 a6 6 0 1 1 -6 8"/><path d="M60 128 a5 5 0 1 0 6 6"/><path d="M140 128 a5 5 0 1 1 -6 6"/>
    </g>
    <g fill="#4d545c" opacity=".8"><circle cx="90" cy="72" r="2.4"/><circle cx="110" cy="74" r="2.4"/><circle cx="66" cy="88" r="2.6"/><circle cx="134" cy="88" r="2.6"/></g>
    <path d="M64 100 C70 90 84 88 92 98 C84 104 72 106 64 100Z" fill="url(#lEye)" stroke="#2f3a40" stroke-width="2.2"/>
    <path d="M136 100 C130 90 116 88 108 98 C116 104 128 106 136 100Z" fill="url(#lEye)" stroke="#2f3a40" stroke-width="2.2"/>
    <ellipse cx="79" cy="97" rx="2.6" ry="6" fill="#111"/><ellipse cx="121" cy="97" rx="2.6" ry="6" fill="#111"/>
    <circle cx="81" cy="94" r="1.4" fill="#fff"/><circle cx="123" cy="94" r="1.4" fill="#fff"/>
    <path d="M88 108 C94 114 106 114 112 108 C110 130 90 130 88 108Z" fill="#f7f9fb"/>
    <path d="M92 118 L108 118 L100 128Z" fill="#d98c94" stroke="#a65a63" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M100 128 L100 136 M100 136 C96 142 88 142 86 138 M100 136 C104 142 112 142 114 138" stroke="#4d545c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <g stroke="#8c949c" stroke-width="1.3" opacity=".8"><path d="M84 132 L56 128"/><path d="M84 136 L58 140"/><path d="M116 132 L144 128"/><path d="M116 136 L142 140"/></g>
    <path d="M70 160 C80 170 120 170 130 160" stroke="#3a86ff" stroke-width="6" fill="none"/>
    <path d="M76 164 l6 -4 6 4 6 -4 6 4 6 -4 6 4 6 -4 6 4" stroke="#ffc93c" stroke-width="2" fill="none"/>
  </g>
  <circle cx="100" cy="100" r="96" fill="none" stroke="#f8dc94" stroke-width="4"/>
</svg>`
};
