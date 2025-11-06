import React from 'react'

export const SkipLinks: React.FC = () => {
  const skipToMain = () => {
    const main = document.querySelector('main') || document.querySelector('[role="main"]')
    if (main) {
      (main as HTMLElement).focus()
      (main as HTMLElement).scrollIntoView()
    }
  }

  const skipToNav = () => {
    const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]')
    if (nav) {
      (nav as HTMLElement).focus()
      (nav as HTMLElement).scrollIntoView()
    }
  }

  return (
    <div className="skip-links" aria-label="Links de navegação rápida">
      <a 
        href="#main-content" 
        className="skip-link"
        onClick={(e) => { e.preventDefault(); skipToMain() }}
        aria-label="Pular para conteúdo principal"
      >
        Pular para conteúdo principal
      </a>
      <a 
        href="#navigation" 
        className="skip-link"
        onClick={(e) => { e.preventDefault(); skipToNav() }}
        aria-label="Pular para navegação"
      >
        Pular para navegação
      </a>
    </div>
  )
}
