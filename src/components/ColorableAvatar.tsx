'use client';

import { useState, useRef, useEffect } from 'react';

interface ColorableAvatarProps {
  initialColor?: string;
  onColorChange?: (color: string) => void;
  size?: number;
  showColorPicker?: boolean;
  className?: string;
}

const ColorableAvatar: React.FC<ColorableAvatarProps> = ({
  initialColor = '#262D59',
  onColorChange,
  size = 100,
  showColorPicker = true,
  className = ''
}) => {
  const [noiseColor, setNoiseColor] = useState(initialColor);
  const [showPicker, setShowPicker] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Predefined color palette
  const colorPalette = [
    '#262D59', // Original blue
    '#8B4513', // Brown
    '#228B22', // Green
    '#DC143C', // Red
    '#4B0082', // Purple
    '#FF8C00', // Orange
    '#2F4F4F', // Dark gray
    '#800080', // Purple
    '#008B8B', // Teal
    '#B22222', // Fire brick
    '#9932CC', // Dark orchid
    '#8B008B'  // Dark magenta
  ];

  useEffect(() => {
    setNoiseColor(initialColor);
    // Also update the SVG immediately when initialColor changes
    if (svgRef.current) {
      const floodElement = svgRef.current.querySelector('#noise-flood');
      if (floodElement) {
        floodElement.setAttribute('flood-color', `${initialColor}E3`);
      }
    }
  }, [initialColor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateNoiseColor = (color: string) => {
    setNoiseColor(color);
    
    // Update the SVG filter's flood-color
    if (svgRef.current) {
      const floodElement = svgRef.current.querySelector('#noise-flood');
      if (floodElement) {
        floodElement.setAttribute('flood-color', `${color}E3`); // Add opacity
      }
    }
    
    onColorChange?.(color);
  };

  const handleColorSelect = (color: string) => {
    updateNoiseColor(color);
    setShowPicker(false);
  };

  const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNoiseColor(event.target.value);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="relative">
        <svg 
          ref={svgRef}
          key={initialColor} // Force re-render when initial color changes
          width={size} 
          height={size * 0.66} 
          viewBox="0 0 100 66" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="cursor-pointer hover:scale-105 transition-transform duration-200"
          onClick={() => showColorPicker && setShowPicker(!showPicker)}
        >
          <g filter="url(#filter0_n_2081_152)">
            <mask id="path-1-inside-1_2081_152" fill="white">
              <path d="M100 43.2692C100 66.6351 68.0288 67.5481 51.2019 63.9423C34.375 60.3365 0 75.5294 0 52.1635C0 18.9904 21.5782 0 52.6442 0C83.7102 0 100 19.9033 100 43.2692Z"/>
            </mask>
            <path d="M100 43.2692C100 66.6351 68.0288 67.5481 51.2019 63.9423C34.375 60.3365 0 75.5294 0 52.1635C0 18.9904 21.5782 0 52.6442 0C83.7102 0 100 19.9033 100 43.2692Z" fill="#DEDEDE"/>
            <path d="M100.5 43.2692C100.167 43.2692 99.8333 43.2692 99.5 43.2692C99.8334 43.6859 99.9895 44.1118 99.9685 44.5221C99.8062 48.6887 97.7632 52.7847 94.5808 55.168C81.641 63.5588 65.5749 54.9326 53.8703 51.49C50.9867 50.7044 48.4184 50.431 46.0267 50.3717C34.7232 50.3077 26.0382 52.3393 18.5127 52.6884C14.9371 52.9721 11.6199 52.4033 11.6727 52.3662C11.6738 52.3935 11.8739 52.5426 12.0749 52.7922C12.2786 53.036 12.4418 53.3549 12.4712 53.4984C12.5335 53.826 12.2325 53.2864 12.179 52.1635C10.3475 28.3476 26.453 9.12899 52.6442 7.62423C69.8246 5.73063 88.5409 12.5354 96.0205 30.2839C97.7919 34.3187 98.9528 38.7137 99.5 43.2692C99.8333 43.2692 100.167 43.2692 100.5 43.2692C101.048 38.6233 100.94 33.8231 100.018 29.0604C96.8756 8.01595 74.0143 -7.07314 52.6442 -7.62423C37.4672 -8.78484 20.0645 -5.21761 7.01767 6.57771C-6.17102 18.2414 -11.9121 36.1587 -12.179 52.1635C-12.2274 55.5697 -11.9086 59.5483 -9.95771 63.946C-8.08885 68.3459 -3.99655 72.5104 -0.0161271 74.5517C8.08561 78.6111 14.1234 78.2198 19.414 78.2621C29.7993 77.9553 38.8067 76.2108 45.4434 76.3651C46.7394 76.3916 47.8378 76.4174 48.5336 76.3947C66.6185 78.2432 86.587 71.2836 96.4992 56.832C98.8689 52.9316 99.7767 48.6588 99.9685 44.5221C99.9894 44.1119 100.167 43.7026 100.5 43.2692ZM99.5 43.2692H100.5H99.5Z" fill="black" mask="url(#path-1-inside-1_2081_152)"/>
          </g>
          <ellipse cx="61.0575" cy="30.2885" rx="2.88462" ry="7.69231" fill="#D9D9D9"/>
          <ellipse cx="61.5083" cy="32.9327" rx="1.89303" ry="5.04808" fill="#0B0B0B"/>
          <ellipse cx="76.4422" cy="30.2885" rx="2.88462" ry="7.69231" fill="#D9D9D9"/>
          <ellipse cx="76.4121" cy="32.9327" rx="1.89303" ry="5.04808" fill="#0B0B0B"/>
          <defs>
            <filter id="filter0_n_2081_152" x="0" y="0" width="100" height="65.5234" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feTurbulence type="fractalNoise" baseFrequency="10 10" stitchTiles="stitch" numOctaves="3" result="noise" seed="2781" />
              <feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "/>
              </feComponentTransfer>
              <feComposite operator="in" in2="shape" in="coloredNoise1" result="noise1Clipped" />
              <feFlood id="noise-flood" floodColor={`${noiseColor}E3`} result="color1Flood" />
              <feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
              <feMerge result="effect1_noise_2081_152">
                <feMergeNode in="shape" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {showColorPicker && showPicker && (
          <div 
            ref={pickerRef}
            className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[240px]"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Avatar Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colorPalette.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        noiseColor === color ? 'border-black ring-2 ring-gray-400' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={noiseColor}
                    onChange={handleCustomColorChange}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={noiseColor}
                    onChange={(e) => updateNoiseColor(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-black"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {showColorPicker && (
        <p className="text-xs text-gray-500 mt-1 text-center">
          Click to customize
        </p>
      )}
    </div>
  );
};

export default ColorableAvatar;
