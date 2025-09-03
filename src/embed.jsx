import React from 'react'
import { createRoot } from 'react-dom/client'
import EPDeliveryFunnel from './EPDeliveryFunnel.jsx'
import './styles.css'

const MOUNT_SELECTOR = '[data-epower-delivery-funnel]'

function mount(node) {
  if (node.__epowerMounted) return
  const root = createRoot(node)
  root.render(
    <div className="epower-scope">
      <EPDeliveryFunnel />
    </div>
  )
  node.__epowerMounted = root
}

function unmount(node) {
  node.__epowerMounted?.unmount?.()
  node.__epowerMounted = null
}

function mountAll(scope = document) {
  scope.querySelectorAll(MOUNT_SELECTOR).forEach(mount)
}
function unmountAll(scope = document) {
  scope.querySelectorAll(MOUNT_SELECTOR).forEach(unmount)
}

document.addEventListener('DOMContentLoaded', () => mountAll())
document.addEventListener('shopify:section:load', e => {
  unmountAll(e.target)
  mountAll(e.target)
})
