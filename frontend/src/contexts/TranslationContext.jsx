import React, { createContext, useContext, useState, useEffect } from 'react';

const TranslationContext = createContext();

export const useTranslation = () => {
    return useContext(TranslationContext);
};

export const TranslationProvider = ({ children, targetLanguage }) => {
    const [cache, setCache] = useState({});

    // This queue stores strings that need translation
    const [queue, setQueue] = useState([]);

    const translateBatch = async (textsToTranslate) => {
        if (!textsToTranslate.length || targetLanguage === 'en') return;

        try {
            // Join with a unique delimiter that translates reliably (double newline)
            const combinedText = textsToTranslate.join('\n\n');
            const response = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(combinedText)}`
            );
            const data = await response.json();
            
            // Reconstruct the translated text
            const fullTranslatedText = data[0].map(item => item[0]).join('');
            
            // Split back by double newline (or single if Google collapsed them)
            // Note: Google Translate sometimes alters whitespace.
            const translatedSegments = fullTranslatedText.split(/\n+/).map(t => t.trim());

            setCache(prev => {
                const next = { ...prev };
                if (!next[targetLanguage]) next[targetLanguage] = {};
                
                textsToTranslate.forEach((original, idx) => {
                    // Fallback to original if segmentation mismatch
                    next[targetLanguage][original] = translatedSegments[idx] || original;
                });
                return next;
            });
            
        } catch (error) {
            console.error('Batch translation error:', error);
        }
    };

    // Debounced processing of the translation queue
    useEffect(() => {
        if (queue.length > 0) {
            const timeout = setTimeout(() => {
                const uniqueTexts = [...new Set(queue)];
                // Filter out already cached
                const toTranslate = uniqueTexts.filter(
                    text => !cache[targetLanguage]?.[text] && text.trim() !== ''
                );
                
                if (toTranslate.length > 0) {
                    translateBatch(toTranslate);
                }
                setQueue([]); // clear queue
            }, 500); // 500ms debounce
            
            return () => clearTimeout(timeout);
        }
    }, [queue, targetLanguage]);

    const t = (text) => {
        if (!text || targetLanguage === 'en') return text;

        if (cache[targetLanguage] && cache[targetLanguage][text]) {
            return cache[targetLanguage][text];
        }

        // Add to queue if not queued
        setQueue(prev => {
            if (!prev.includes(text)) {
                return [...prev, text];
            }
            return prev;
        });

        // Return original text while loading
        return text;
    };

    return (
        <TranslationContext.Provider value={{ t }}>
            {children}
        </TranslationContext.Provider>
    );
};
