// Importa o React para usar seus hooks (useState e useEffect)
import * as React from "react"

// Largura máxima em pixels que define um dispositivo como "mobile"
// Telas com menos de 768px de largura são consideradas mobile
const MOBILE_BREAKPOINT = 768

/**
 * Hook personalizado que detecta se o usuário está em um dispositivo mobile.
 * Retorna `true` se a tela for menor que 768px, `false` caso contrário.
 * Atualiza automaticamente quando a janela é redimensionada.
 */
export function useIsMobile() {
  // Estado que armazena se é mobile (undefined = ainda não calculado)
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Cria uma "media query" que observa a largura da janela
    // Será "true" quando a largura for menor que MOBILE_BREAKPOINT - 1 (767px)
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    // Função que atualiza o estado quando a largura da janela muda
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Registra o listener: sempre que a media query mudar, chama onChange
    mql.addEventListener("change", onChange)

    // Define o valor inicial imediatamente (sem esperar uma mudança)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Cleanup: remove o listener quando o componente é desmontado (evita memory leak)
    return () => mql.removeEventListener("change", onChange)
  }, []) // [] = roda apenas uma vez quando o componente monta

  // Converte undefined para false com "!!" (double negation)
  // Garante que o retorno seja sempre boolean (true ou false), nunca undefined
  return !!isMobile
}
