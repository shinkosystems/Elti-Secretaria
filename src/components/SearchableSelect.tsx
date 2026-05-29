import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface Option {
    id: string | number;
    label: string;
    description?: string;
    [key: string]: any;
}

interface SearchableSelectProps {
    options: Option[];
    value: string | number | null;
    onChange: (value: any) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    noResultsText?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
    customFilter?: (option: Option, searchTerm: string) => boolean;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Selecione uma opção...',
    searchPlaceholder = 'Buscar...',
    noResultsText = 'Nenhum resultado encontrado',
    className,
    disabled = false,
    required = false,
    customFilter
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(option => {
        if (!searchTerm) return true;

        if (customFilter) {
            return customFilter(option, searchTerm);
        }

        const term = searchTerm.toLowerCase();
        return (
            option.label.toLowerCase().includes(term) ||
            (option.description && option.description.toLowerCase().includes(term))
        );
    });

    const handleSelect = (option: Option) => {
        onChange(option.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full bg-white border-2 border-transparent shadow-sm rounded-[24px] py-4 px-8 font-black text-[#0E3A8C] outline-none focus:border-blue-100 transition-all text-sm flex items-center justify-between cursor-pointer text-left",
                    disabled && "opacity-50 cursor-not-allowed",
                    isOpen && "border-blue-100 ring-4 ring-blue-50/50"
                )}
            >
                <div className="flex flex-col truncate">
                    {selectedOption ? (
                        <>
                            <span className="truncate">{selectedOption.label}</span>
                            {selectedOption.description && (
                                <span className="text-[10px] text-gray-400 font-bold truncate">{selectedOption.description}</span>
                            )}
                        </>
                    ) : (
                        <span className="text-gray-300 font-bold">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-[150] w-full mt-2 bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none font-bold text-sm text-[#0E3A8C] w-full placeholder:text-gray-300"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto p-2 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={cn(
                                            "w-full p-4 rounded-2xl flex items-center justify-between transition-all group hover:bg-blue-50 text-left",
                                            value === option.id ? "bg-blue-50/50" : "bg-transparent"
                                        )}
                                    >
                                        <div className="flex flex-col truncate">
                                            <span className={cn(
                                                "font-black text-sm truncate",
                                                value === option.id ? "text-[#0E3A8C]" : "text-gray-600 group-hover:text-[#0E3A8C]"
                                            )}>
                                                {option.label}
                                            </span>
                                            {option.description && (
                                                <span className="text-[10px] text-gray-400 font-bold truncate">
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
                                        {value === option.id && (
                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-[#0E3A8C]" />
                                            </div>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="p-10 text-center">
                                    <p className="text-gray-400 font-bold text-sm">{noResultsText}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
