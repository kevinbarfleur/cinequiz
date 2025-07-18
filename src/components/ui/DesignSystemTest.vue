<template>
  <div class="container-app">
    <div class="space-responsive">
      <!-- Header responsive -->
      <section class="text-center space-responsive">
        <h1 class="heading-1 rainbow-text">Design System Test</h1>
        <p class="body-text">Système de design responsive avec UnoCSS et layout mobile-first</p>
      </section>

      <!-- Container Examples -->
      <section class="space-responsive">
        <h2 class="heading-2">Container Examples</h2>
        <div class="space-y-4">
          <div class="container-sm bg-bg-soft rounded-lg p-4">
            <h4 class="heading-4 mb-2">Container Small (640px max)</h4>
            <p class="body-sm">Container avec padding responsive automatique.</p>
          </div>
          <div class="container-md bg-bg-soft rounded-lg p-4">
            <h4 class="heading-4 mb-2">Container Medium (768px max)</h4>
            <p class="body-sm">Idéal pour les formulaires et contenus moyens.</p>
          </div>
          <div class="container-lg bg-bg-soft rounded-lg p-4">
            <h4 class="heading-4 mb-2">Container Large (1024px max)</h4>
            <p class="body-sm">Parfait pour les dashboards et contenus complexes.</p>
          </div>
        </div>
      </section>

      <!-- Grid Examples -->
      <section class="space-responsive">
        <h2 class="heading-2">Grid Examples</h2>
        
        <!-- Grid Auto -->
        <div class="mb-6">
          <h3 class="heading-3 mb-4">Grid Auto (1 → 2 → 3 → 4)</h3>
          <div class="grid-auto">
            <div class="card-responsive">
              <h4 class="heading-4 mb-2">Card 1</h4>
              <p class="body-sm">Responsive automatique</p>
            </div>
            <div class="card-responsive">
              <h4 class="heading-4 mb-2">Card 2</h4>
              <p class="body-sm">S'adapte aux breakpoints</p>
            </div>
            <div class="card-responsive">
              <h4 class="heading-4 mb-2">Card 3</h4>
              <p class="body-sm">Mobile-first design</p>
            </div>
            <div class="card-responsive">
              <h4 class="heading-4 mb-2">Card 4</h4>
              <p class="body-sm">Espacement cohérent</p>
            </div>
          </div>
        </div>

        <!-- Grid Cards -->
        <div class="mb-6">
          <h3 class="heading-3 mb-4">Grid Cards (1 → 2 → 3)</h3>
          <div class="grid-cards">
            <div class="feature-card">
              <div class="feature-card-content">
                <div class="feature-card-header">
                  <div class="i-carbon-lightning feature-card-icon"></div>
                  <h4 class="feature-card-title">Performance</h4>
                </div>
                <p class="feature-card-description">
                  Optimisé pour tous les appareils avec des performances maximales.
                </p>
              </div>
            </div>
            <div class="feature-card">
              <div class="feature-card-content">
                <div class="feature-card-header">
                  <div class="i-carbon-mobile feature-card-icon"></div>
                  <h4 class="feature-card-title">Mobile-First</h4>
                </div>
                <p class="feature-card-description">
                  Conçu d'abord pour mobile, puis adapté aux écrans plus grands.
                </p>
              </div>
            </div>
            <div class="feature-card">
              <div class="feature-card-content">
                <div class="feature-card-header">
                  <div class="i-carbon-accessibility feature-card-icon"></div>
                  <h4 class="feature-card-title">Accessible</h4>
                </div>
                <p class="feature-card-description">
                  Respecte les standards d'accessibilité pour tous les utilisateurs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Flexbox Examples -->
      <section class="space-responsive">
        <h2 class="heading-2">Flexbox Responsive</h2>
        
        <div class="mb-6">
          <h3 class="heading-3 mb-4">Flex Column → Row</h3>
          <div class="flex-col-mobile gap-responsive items-center">
            <div class="card p-4 flex-1">
              <h4 class="heading-4 mb-2">Item 1</h4>
              <p class="body-sm">Colonne sur mobile</p>
            </div>
            <div class="card p-4 flex-1">
              <h4 class="heading-4 mb-2">Item 2</h4>
              <p class="body-sm">Ligne sur écrans plus grands</p>
            </div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="heading-3 mb-4">Flex Between</h3>
          <div class="card p-4">
            <div class="flex-between">
              <div>
                <h4 class="heading-4">Titre</h4>
                <p class="body-sm">Description courte</p>
              </div>
              <button class="btn-brand btn-md">Action</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Typography Test -->
      <section class="space-responsive">
        <h2 class="heading-2">Typography Responsive</h2>
        <div class="space-y-4">
          <h1 class="heading-1">Heading 1 - Responsive</h1>
          <h2 class="heading-2">Heading 2 - Responsive</h2>
          <h3 class="heading-3">Heading 3 - Responsive</h3>
          <h4 class="heading-4">Heading 4 - Responsive</h4>
          <p class="body-text">Body text qui s'adapte automatiquement à la taille d'écran pour une meilleure lisibilité.</p>
          <p class="body-sm">Body small avec taille responsive pour les descriptions secondaires.</p>
          <p class="small-text">Small text pour les notes et mentions légales, optimisé mobile.</p>
          <a href="#" class="link-hover">Lien avec effets hover responsive</a>
          <code class="code-inline">inline code responsive</code>
        </div>
      </section>

      <!-- Button Test -->
      <section class="space-responsive">
        <h2 class="heading-2">Buttons Responsive</h2>
        <div class="space-y-6">
          <div>
            <h3 class="heading-3 mb-4">Tailles Responsive</h3>
            <div class="flex-col-mobile gap-responsive items-start">
              <button class="btn-brand btn-sm">Small Responsive</button>
              <button class="btn-brand btn-md">Medium Responsive</button>
              <button class="btn-brand btn-lg">Large Responsive</button>
            </div>
          </div>
          
          <div>
            <h3 class="heading-3 mb-4">Variantes</h3>
            <div class="grid-responsive grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
              <button class="btn-brand btn-md">Brand</button>
              <button class="btn-alt btn-md">Alternative</button>
              <button class="btn-sponsor btn-md">Sponsor</button>
              <button class="btn-outline btn-md">Outline</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Icon Test -->
      <section class="space-responsive">
        <h2 class="heading-2">Icons Responsive</h2>
        
        <!-- Carbon Icons -->
        <div class="mb-6">
          <h3 class="heading-3 mb-4">Carbon Icons</h3>
          <div class="flex flex-wrap gap-responsive items-center">
            <div class="flex items-center gap-2">
              <div class="i-carbon-trophy text-xl sm:text-2xl text-brand-1"></div>
              <span class="body-sm">Trophy</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="i-carbon-star text-xl sm:text-2xl text-yellow-1"></div>
              <span class="body-sm">Star</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="i-carbon-checkmark text-xl sm:text-2xl text-green-1"></div>
              <span class="body-sm">Check</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="i-carbon-close text-xl sm:text-2xl text-red-1"></div>
              <span class="body-sm">Close</span>
            </div>
          </div>
        </div>
        
        <!-- Framework Logos -->
        <div class="mb-6">
          <h3 class="heading-3 mb-4">Framework Logos</h3>
          <div class="flex flex-wrap gap-responsive items-center">
            <div class="i-logos-vue text-2xl sm:text-3xl"></div>
            <div class="i-logos-typescript-icon text-2xl sm:text-3xl"></div>
            <div class="i-logos-vitejs text-2xl sm:text-3xl"></div>
            <div class="i-logos-pinia text-2xl sm:text-3xl"></div>
            <div class="i-logos-unocss text-2xl sm:text-3xl"></div>
          </div>
        </div>
      </section>

      <!-- Custom Blocks Test -->
      <section class="space-responsive">
        <h2 class="heading-2">Custom Blocks</h2>
        <div class="space-y-4">
          <div class="custom-block-info">
            <strong>Info :</strong> Bloc d'information avec couleurs de marque responsive.
          </div>
          <div class="custom-block-tip">
            <strong>Tip :</strong> Conseil utile avec couleurs vertes et espacement adaptatif.
          </div>
          <div class="custom-block-warning">
            <strong>Warning :</strong> Avertissement important avec couleurs jaunes.
          </div>
          <div class="custom-block-danger">
            <strong>Danger :</strong> Attention critique avec couleurs rouges.
          </div>
        </div>
      </section>

      <!-- Spacing Examples -->
      <section class="space-responsive">
        <h2 class="heading-2">Spacing Responsive</h2>
        <div class="space-y-4">
          <div class="card p-responsive">
            <h4 class="heading-4 mb-2">Padding Responsive</h4>
            <p class="body-sm">Le padding s'adapte automatiquement : p-4 sur mobile, p-6 sur sm, p-8 sur md+</p>
          </div>
          <div class="card m-responsive">
            <h4 class="heading-4 mb-2">Margin Responsive</h4>
            <p class="body-sm">Les marges suivent le même principe adaptatif.</p>
          </div>
        </div>
      </section>

      <!-- Breakpoint Info -->
      <section class="space-responsive">
        <h2 class="heading-2">Breakpoints Info</h2>
        <div class="grid-responsive grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div class="card p-4 bg-green-soft border border-green-1/20">
            <h4 class="heading-4 mb-2 text-green-1">Mobile (< 640px)</h4>
            <p class="body-sm">Layout en colonne, boutons pleine largeur, typographie optimisée</p>
          </div>
          <div class="card p-4 bg-blue-soft border border-blue-1/20">
            <h4 class="heading-4 mb-2 text-blue-1">Small+ (640px+)</h4>
            <p class="body-sm">Grilles 2 colonnes, espacement augmenté, meilleure hiérarchie</p>
          </div>
          <div class="card p-4 bg-purple-soft border border-purple-1/20">
            <h4 class="heading-4 mb-2 text-purple-1">Large+ (1024px+)</h4>
            <p class="body-sm">Layout complet, sidebars, maximum 4 colonnes</p>
          </div>
        </div>
      </section>

      <!-- Theme Toggle Test -->
      <section class="space-responsive">
        <h2 class="heading-2">Theme Integration</h2>
        <div class="flex-center">
          <button @click="toggleTheme" class="btn-brand btn-lg">
            <div class="i-carbon-moon mr-2"></div>
            Toggle Theme ({{ currentTheme }})
          </button>
        </div>
        <p class="text-center body-sm mt-4">
          Tous les composants s'adaptent automatiquement au thème clair/sombre
        </p>
      </section>

      <!-- Modal Examples -->
      <section class="space-responsive">
        <h2 class="heading-2">Modal Examples</h2>
        <div class="space-y-6">
          <div>
            <h3 class="heading-3 mb-4">Tailles et Positionnement</h3>
            <div class="grid-responsive grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
              <button class="btn-brand btn-md" @click="showModalSmall = true">
                Small Modal
              </button>
              <button class="btn-brand btn-md" @click="showModalMedium = true">
                Medium Modal
              </button>
              <button class="btn-brand btn-md" @click="showModalLarge = true">
                Large Modal
              </button>
              <button class="btn-brand btn-md" @click="showModalFullscreen = true">
                Fullscreen Mobile
              </button>
            </div>
          </div>
          
          <div>
            <h3 class="heading-3 mb-4">Variantes et Options</h3>
            <div class="grid-responsive grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <button class="btn-alt btn-md" @click="showModalTop = true">
                Position Top
              </button>
              <button class="btn-alt btn-md" @click="showModalBottom = true">
                Position Bottom
              </button>
              <button class="btn-alt btn-md" @click="showModalPersistent = true">
                Persistent Modal
              </button>
              <button class="btn-outline btn-md" @click="showModalNoBlur = true">
                Sans Blur
              </button>
              <button class="btn-outline btn-md" @click="showModalSlideUp = true">
                Slide Up
              </button>
              <button class="btn-outline btn-md" @click="showModalFade = true">
                Fade Only
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Modal Demos -->
      <!-- Small Modal -->
      <BaseModal
        v-model:isVisible="showModalSmall"
        title="Small Modal"
        size="sm"
        description="Ceci est une petite modale pour les confirmations rapides."
      >
        <p class="body-sm">
          Contenu de la petite modale. Idéale pour les confirmations simples et les alertes courtes.
        </p>
        <template #footer>
          <div class="flex gap-3 justify-end">
            <button class="btn-alt btn-md" @click="showModalSmall = false">
              Annuler
            </button>
            <button class="btn-brand btn-md" @click="showModalSmall = false">
              Confirmer
            </button>
          </div>
        </template>
      </BaseModal>

      <!-- Medium Modal -->
      <BaseModal
        v-model:isVisible="showModalMedium"
        title="Medium Modal"
        size="md"
        backdrop="blur"
      >
        <div class="space-y-4">
          <p class="body-sm">
            Modale de taille moyenne avec backdrop blur. Parfaite pour les formulaires et les contenus détaillés.
          </p>
          <div class="custom-block-info">
            <strong>Info :</strong> Cette modale utilise backdrop-blur pour un effet moderne.
          </div>
          <div class="space-y-2">
            <label class="block body-sm font-medium">
              Nom d'utilisateur
            </label>
            <input 
              class="w-full px-3 py-2 border border-divider rounded-lg focus:ring-2 focus:ring-brand-1 focus:border-transparent"
              placeholder="Votre nom..."
            />
          </div>
        </div>
        <template #footer>
          <div class="flex-col-mobile gap-3 justify-end">
            <button class="btn-alt btn-md flex-1" @click="showModalMedium = false">
              Annuler
            </button>
            <button class="btn-brand btn-md flex-1" @click="showModalMedium = false">
              Sauvegarder
            </button>
          </div>
        </template>
      </BaseModal>

      <!-- Large Modal -->
      <BaseModal
        v-model:isVisible="showModalLarge"
        title="Large Modal"
        size="lg"
        max-height="80vh"
      >
        <div class="space-y-6">
          <p class="body-sm">
            Grande modale avec contenu scrollable. Démontre la gestion de contenu long avec scroll interne.
          </p>
          
          <div class="grid-responsive grid-cols-1 sm:grid-cols-2">
            <div class="feature-card">
              <div class="feature-card-content">
                <div class="feature-card-header">
                  <div class="i-carbon-accessibility feature-card-icon"></div>
                  <h4 class="feature-card-title">Accessibilité</h4>
                </div>
                <p class="feature-card-description">
                  Focus trap, navigation clavier, annonces aux lecteurs d'écran.
                </p>
              </div>
            </div>
            
            <div class="feature-card">
              <div class="feature-card-content">
                <div class="feature-card-header">
                  <div class="i-carbon-mobile feature-card-icon"></div>
                  <h4 class="feature-card-title">Mobile-First</h4>
                </div>
                <p class="feature-card-description">
                  Responsive design avec mode plein écran sur mobile.
                </p>
              </div>
            </div>
          </div>
          
          <div class="space-y-4">
            <h4 class="heading-4">Contenu Long</h4>
            <p class="body-sm">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p class="body-sm">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p class="body-sm">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
          </div>
        </div>
        <template #footer>
          <div class="flex gap-3 justify-between">
            <button class="btn-outline btn-md" @click="showModalLarge = false">
              <div class="i-carbon-information mr-2"></div>
              Plus d'infos
            </button>
            <div class="flex gap-3">
              <button class="btn-alt btn-md" @click="showModalLarge = false">
                Fermer
              </button>
              <button class="btn-brand btn-md" @click="showModalLarge = false">
                Valider
              </button>
            </div>
          </div>
        </template>
      </BaseModal>

      <!-- Position Variants -->
      <BaseModal
        v-model:isVisible="showModalTop"
        title="Modal Position Top"
        size="md"
        position="top"
      >
        <p class="body-sm">
          Cette modale s'affiche en haut de l'écran. Utile pour les notifications et les alertes importantes.
        </p>
      </BaseModal>

      <BaseModal
        v-model:isVisible="showModalBottom"
        title="Modal Position Bottom"
        size="md"
        position="bottom"
      >
        <p class="body-sm">
          Cette modale s'affiche en bas de l'écran, similaire aux bottom sheets sur mobile.
        </p>
      </BaseModal>

      <BaseModal
        v-model:isVisible="showModalPersistent"
        title="Modal Persistante"
        size="md"
        :persistent="true"
        :close-on-overlay="false"
        :close-on-escape="false"
      >
        <div class="space-y-4">
          <p class="body-sm">
            Cette modale ne peut pas être fermée en cliquant à l'extérieur ou avec Échap.
          </p>
          <div class="custom-block-warning">
            <strong>Attention :</strong> Utilisez les modales persistantes avec parcimonie pour ne pas frustrer l'utilisateur.
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <button class="btn-brand btn-md" @click="showModalPersistent = false">
              Fermer avec bouton
            </button>
          </div>
        </template>
      </BaseModal>

      <!-- Other Variants -->
      <BaseModal
        v-model:isVisible="showModalNoBlur"
        title="Sans Backdrop Blur"
        size="md"
        backdrop="dark"
      >
        <p class="body-sm">
          Cette modale utilise un fond sombre sans effet de flou.
        </p>
      </BaseModal>

      <BaseModal
        v-model:isVisible="showModalSlideUp"
        title="Animation Slide Up"
        size="md"
        animation="slide-up"
      >
        <p class="body-sm">
          Cette modale apparaît avec une animation de glissement vers le haut.
        </p>
      </BaseModal>

      <BaseModal
        v-model:isVisible="showModalFade"
        title="Animation Fade"
        size="md"
        animation="fade"
      >
        <p class="body-sm">
          Cette modale utilise uniquement un effet de fondu, sans transformation.
        </p>
      </BaseModal>

      <BaseModal
        v-model:isVisible="showModalFullscreen"
        title="Fullscreen sur Mobile"
        size="lg"
        :fullscreen-on-mobile="true"
      >
        <div class="space-y-4">
          <p class="body-sm">
            Cette modale devient plein écran sur mobile pour une meilleure expérience utilisateur.
          </p>
          <div class="custom-block-tip">
            <strong>Tip :</strong> Redimensionnez votre navigateur ou utilisez les outils de développement pour tester le comportement mobile.
          </div>
        </div>
      </BaseModal>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/utils/theme'
import BaseModal from './BaseModal.vue'

const { currentTheme, toggle } = useTheme()

const toggleTheme = () => {
  toggle()
}

// Modal states
const showModalSmall = ref(false)
const showModalMedium = ref(false)
const showModalLarge = ref(false)
const showModalTop = ref(false)
const showModalBottom = ref(false)
const showModalPersistent = ref(false)
const showModalNoBlur = ref(false)
const showModalSlideUp = ref(false)
const showModalFade = ref(false)
const showModalFullscreen = ref(false)
</script>