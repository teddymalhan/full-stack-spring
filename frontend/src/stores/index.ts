import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  openModals: Set<string>
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (id: string) => void
  closeModal: (id: string) => void
  isModalOpen: (id: string) => boolean
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      sidebarOpen: true,
      openModals: new Set<string>(),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

      openModal: (id: string) =>
        set((state) => {
          const newModals = new Set(state.openModals)
          newModals.add(id)
          return { openModals: newModals }
        }),

      closeModal: (id: string) =>
        set((state) => {
          const newModals = new Set(state.openModals)
          newModals.delete(id)
          return { openModals: newModals }
        }),

      isModalOpen: (id: string) => get().openModals.has(id),
    }),
    { name: 'ui-store' }
  )
)

interface NavigationState {
  activeSection: string
  isMobileMenuOpen: boolean
  commandOpen: boolean
  isVisible: boolean
  canvasDimensions: { width: number; height: number }
  resumePath: string | null

  setActiveSection: (section: string) => void
  setIsMobileMenuOpen: (open: boolean) => void
  setCommandOpen: (open: boolean) => void
  setIsVisible: (visible: boolean) => void
  updateCanvasDimensions: () => void
  fetchResumePath: (isResumeVisible: boolean) => void
  handleScroll: (prefersReducedMotion: boolean, navItems: { href: string }[]) => void
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      activeSection: 'home',
      isMobileMenuOpen: false,
      commandOpen: false,
      isVisible: true,
      canvasDimensions: { width: 0, height: 0 },
      resumePath: null,

      setActiveSection: (section: string) => set({ activeSection: section }),

      setIsMobileMenuOpen: (open: boolean) => set({ isMobileMenuOpen: open }),

      setCommandOpen: (open: boolean) => set({ commandOpen: open }),

      setIsVisible: (visible: boolean) => set({ isVisible: visible }),

      updateCanvasDimensions: () => {
        if (typeof window !== 'undefined') {
          set({
            canvasDimensions: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
          })
        }
      },

      fetchResumePath: (_isResumeVisible: boolean) => {
        // Placeholder for resume path fetching - can be implemented later if needed
        set({ resumePath: null })
      },

      handleScroll: (prefersReducedMotion: boolean, navItems: { href: string }[]) => {
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight

        // Hide nav when scrolled past first viewport (unless reduced motion)
        const shouldShow = prefersReducedMotion || scrollY < windowHeight * 0.5

        const state = get()
        if (state.isVisible !== shouldShow) {
          set({ isVisible: shouldShow })
        }

        // Update active section based on scroll position
        for (const item of navItems) {
          const sectionId = item.href.slice(1)
          const element = document.getElementById(sectionId)
          if (element) {
            const rect = element.getBoundingClientRect()
            if (rect.top <= 100 && rect.bottom >= 100) {
              if (state.activeSection !== sectionId) {
                set({ activeSection: sectionId })
              }
              break
            }
          }
        }
      },
    }),
    { name: 'navigation-store' }
  )
)
