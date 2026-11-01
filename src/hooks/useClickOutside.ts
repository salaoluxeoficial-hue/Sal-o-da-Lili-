import { useEffect, RefObject } from 'react';

/**
 * Hook global reutilizável para detectar cliques ou toques fora de qualquer elemento (modais, menus, gavetas, popovers).
 * Funciona de forma consistente em computadores, tablets e dispositivos móveis (mouse e touch).
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  param3?: boolean | (RefObject<HTMLElement | null> | undefined)[],
  param4?: boolean | (RefObject<HTMLElement | null> | undefined)[]
) {
  const active = typeof param3 === 'boolean' ? param3 : typeof param4 === 'boolean' ? param4 : true;
  const ignoreRefs = Array.isArray(param3) ? param3 : Array.isArray(param4) ? param4 : undefined;

  useEffect(() => {
    if (!active) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!target || !ref.current) return;

      // Se o clique foi dentro do próprio elemento, não faz nada
      if (ref.current.contains(target)) return;

      // Se o clique foi em algum elemento ignorado (ex: botão de alternância/abertura), não faz nada
      if (ignoreRefs && ignoreRefs.some(r => r?.current && r.current.contains(target))) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener, { passive: true });
    document.addEventListener('touchstart', listener, { passive: true });

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, active, ignoreRefs]);
}
