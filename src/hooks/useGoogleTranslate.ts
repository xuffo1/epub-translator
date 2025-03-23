import { useState, useEffect, useCallback } from 'react';

interface UseGoogleTranslateProps {
  onError?: (error: string) => void;
}

export const useGoogleTranslate = ({ onError }: UseGoogleTranslateProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeTranslate = useCallback(() => {
    try {
      if (!window.google || !window.google.translate) {
        console.warn('Google Translate not available yet');
        return;
      }

      const translateElement = document.getElementById('google_translate_element');
      if (!translateElement) {
        console.warn('Translation element not found');
        return;
      }

      // Clear existing content
      translateElement.innerHTML = '';

      // Initialize translator
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'auto',
          includedLanguages: 'zh-CN,es,en,hi,ar,bn,pt,ru,ja,pa,de,jv,wu,ko,fr,te,vi,mr,ta,tr,ur,it,yue,th,gu,jin,fa,pl,uk,ro',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    } catch (error) {
      const errorMessage = 'Failed to initialize translator';
      console.error('Error initializing translate:', error);
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [onError]);

  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    let mounted = true;

    const loadTranslateScript = async () => {
      try {
        setIsLoading(true);

        // Remove any existing instances
        const existingScript = document.getElementById('google-translate-script');
        if (existingScript) {
          existingScript.remove();
        }

        // Reset error state
        setError(null);

        // Create initialization function
        window.googleTranslateElementInit = () => {
          if (mounted) {
            initializeTranslate();
          }
        };

        // Create and append the script
        scriptElement = document.createElement('script');
        scriptElement.id = 'google-translate-script';
        scriptElement.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        scriptElement.async = true;
        scriptElement.onerror = () => {
          if (mounted) {
            const errorMessage = 'Failed to load translator';
            console.error(errorMessage);
            setError(errorMessage);
            onError?.(errorMessage);
          }
        };

        document.body.appendChild(scriptElement);
      } catch (error) {
        const errorMessage = 'Failed to setup translator';
        console.error('Error setting up translate:', error);
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadTranslateScript();

    // Cleanup function
    return () => {
      mounted = false;
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit;
      }
      const translateElement = document.getElementById('google_translate_element');
      if (translateElement) {
        translateElement.innerHTML = '';
      }
    };
  }, [initializeTranslate]);

  return {
    isLoading,
    error,
    initializeTranslate
  };
}; 