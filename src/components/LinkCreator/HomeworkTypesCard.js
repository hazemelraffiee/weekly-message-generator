import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, Palette } from 'lucide-react';
import { DEFAULT_HOMEWORK_TYPES } from '@/components/LinkCreator/utils';

const TAILWIND_COLORS = {
  red: { bg: 'bg-red-500', text: 'text-red-500', hover: 'hover:bg-red-600', shadow: 'shadow-red-500/20' },
  green: { bg: 'bg-green-500', text: 'text-green-500', hover: 'hover:bg-green-600', shadow: 'shadow-green-500/20' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', hover: 'hover:bg-blue-600', shadow: 'shadow-blue-500/20' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-500', hover: 'hover:bg-purple-600', shadow: 'shadow-purple-500/20' },
  yellow: { bg: 'bg-yellow-500', text: 'text-yellow-500', hover: 'hover:bg-yellow-600', shadow: 'shadow-yellow-500/20' },
  pink: { bg: 'bg-pink-500', text: 'text-pink-500', hover: 'hover:bg-pink-600', shadow: 'shadow-pink-500/20' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-500', hover: 'hover:bg-orange-600', shadow: 'shadow-orange-500/20' },
  teal: { bg: 'bg-teal-500', text: 'text-teal-500', hover: 'hover:bg-teal-600', shadow: 'shadow-teal-500/20' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500', hover: 'hover:bg-indigo-600', shadow: 'shadow-indigo-500/20' },
  gray: { bg: 'bg-gray-500', text: 'text-gray-500', hover: 'hover:bg-gray-600', shadow: 'shadow-gray-500/20' }
};

const ColorSwatch = ({ color, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-8 h-8 rounded-full ${TAILWIND_COLORS[color].bg} transition-all duration-200 
      relative shadow-lg ${TAILWIND_COLORS[color].shadow} ${TAILWIND_COLORS[color].hover}
      ${selected ? 'scale-110 ring-2 ring-white ring-offset-4 ring-offset-gray-800' : 'hover:scale-105'}`}
    aria-label={`Select ${color} color`}
  >
    {selected && (
      <Check className="h-4 w-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" />
    )}
  </button>
);

const ListItem = ({ name, style, onEdit, onDelete }) => {
  // Extract the base color from the style string
  const baseColor = style.split('-')[1]; // e.g., "bg-red-500" -> "red"
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50 group hover:bg-gray-700 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${TAILWIND_COLORS[baseColor].bg}`} />
        <span className="text-gray-100">{name}</span>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 rounded-md hover:bg-gray-600 text-gray-400 hover:text-gray-100 transition-colors"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded-md hover:bg-gray-600 text-gray-400 hover:text-gray-100 transition-colors"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const DefaultTypesPreview = () => (
  <div className="mt-4 space-y-2 opacity-75">
    {Object.values(DEFAULT_HOMEWORK_TYPES).map((type) => {
      const baseColor = type.style.split('-')[1];
      return (
        <div key={type.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-700/30">
          <div className={`w-4 h-4 rounded-full ${TAILWIND_COLORS[baseColor].bg}`} />
          <span className="text-gray-100">{type.label}</span>
        </div>
      );
    })}
  </div>
);

export const HomeworkTypesCard = ({ 
  homeworkTypes, 
  setHomeworkTypes, 
  useDefaultTypes, 
  setUseDefaultTypes 
}) => {
  const [newTypeName, setNewTypeName] = useState('');
  const [selectedColor, setSelectedColor] = useState('red');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    // Only set default types when explicitly switching TO default types
    if (useDefaultTypes) {
      setHomeworkTypes(DEFAULT_HOMEWORK_TYPES);
    }
  }, [useDefaultTypes]);

  const addHomeworkType = useCallback(() => {
    if (newTypeName.trim()) {
      setHomeworkTypes(prev => {
        const id = Date.now().toString();
        return {
          ...prev,
          [id]: {
            id,
            label: newTypeName.trim(),
            template: '',
            style: `bg-${selectedColor}-950`  // Simplified style
          }
        };
      });
      setNewTypeName('');
      setShowColorPicker(false);
    }
  }, [newTypeName, selectedColor, setHomeworkTypes]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.color-picker-container')) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-100">أنواع الواجبات</h2>
        <label className="inline-flex items-center cursor-pointer">
          <span className="text-sm text-gray-400 ml-3">استخدام الأنواع الافتراضية</span>
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={useDefaultTypes}
              onChange={e => setUseDefaultTypes(e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </div>
        </label>
      </div>

      {useDefaultTypes ? (
        <DefaultTypesPreview />
      ) : (
        <div className="space-y-4">
          {/* Custom Type Creator */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                className="w-full h-10 rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="نوع الواجب"
                onKeyDown={(e) => e.key === 'Enter' && addHomeworkType()}
              />
            </div>
            <div className="relative color-picker-container">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`h-10 w-10 rounded-md border border-gray-700 ${TAILWIND_COLORS[selectedColor].bg} 
                  ${TAILWIND_COLORS[selectedColor].hover} transition-all duration-200 
                  shadow-lg ${TAILWIND_COLORS[selectedColor].shadow}
                  hover:scale-105 active:scale-95`}
                aria-label="Select color"
              >
                <Palette className="h-5 w-5 mx-auto text-white/90" />
              </button>
              {showColorPicker && (
                <div className="absolute z-10 p-8 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl">
                  <div className="grid grid-cols-5 gap-8">
                    {Object.keys(TAILWIND_COLORS).map(color => (
                      <ColorSwatch
                        key={color}
                        color={color}
                        selected={color === selectedColor}
                        onClick={() => {
                          setSelectedColor(color);
                          setShowColorPicker(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={addHomeworkType}
              className="inline-flex items-center justify-center rounded-md h-10 px-4 bg-blue-600 hover:bg-blue-700 
                transition-all duration-200 text-white hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 inline-block ml-2" />
              إضافة
            </button>
          </div>

          {/* List of Types */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto rounded-md">
            {Object.values(homeworkTypes).map((type) => (
              <ListItem
                key={type.id}
                name={type.label}
                style={type.style}
                onEdit={() => {
                  const newName = window.prompt('تعديل نوع الواجب', type.label);
                  if (newName?.trim()) {
                    setHomeworkTypes(prev => ({
                      ...prev,
                      [type.id]: {
                        ...prev[type.id],
                        label: newName.trim()
                      }
                    }));
                  }
                }}
                onDelete={() => {
                  setHomeworkTypes(prev => {
                    const newTypes = { ...prev };
                    delete newTypes[type.id];
                    return newTypes;
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkTypesCard;