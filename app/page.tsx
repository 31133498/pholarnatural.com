'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingBag, Menu, Globe, ArrowRight, Play, Star, Plus, Verified, Mail } from 'lucide-react'
export default function Home() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX - window.innerWidth / 2) / 50,
        y: (e.clientY - window.innerHeight / 2) / 50,
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <main>
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-effect shadow-sm">
        <div className="flex justify-between items-center w-full px-5 md:px-16 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
              PN
            </div>
            <span className="font-headline-md text-headline-md font-bold text-primary">Pholar Natural</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="font-body-md text-body-md text-primary font-bold border-b-2 border-secondary pb-1" href="#">Shop</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Services</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">About</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">FAQ</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-high/50 rounded-full transition-all">
              <ShoppingBag className="w-5 h-5" />
            </button>
            <button className="bg-secondary text-white px-6 py-2 rounded-full font-label-sm hover:opacity-90 active:scale-95 transition-all hidden md:block">
              Book Now
            </button>
            <button className="md:hidden p-2">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="pt-24">
        {/* Hero Section */}
        <section className="relative px-5 md:px-16 py-16 max-w-7xl mx-auto overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="z-10 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-label-sm mb-6">
                <Globe className="w-4 h-4" />
                Now Shipping Worldwide
              </div>
              <h1 className="font-headline-display text-headline-lg-mobile md:text-headline-display text-primary mb-6 leading-tight">
                Nature&apos;s finest for <br /><span className="italic text-secondary">your crown</span>.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 max-w-lg">
                Elevate your haircare routine with our premium organic solutions, blending traditional African wisdom with clinical-grade botanical ingredients.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button className="bg-primary text-white px-8 py-4 rounded-full font-label-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-all">
                  Shop Collection
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="border-2 border-secondary text-secondary px-8 py-4 rounded-full font-label-sm hover:bg-secondary/5 transition-all text-center">
                  Book a Service
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-outline-variant pt-6">
                <div>
                  <div className="font-headline-md text-primary">10k+</div>
                  <div className="font-label-sm text-on-surface-variant uppercase">Happy Clients</div>
                </div>
                <div>
                  <div className="font-headline-md text-primary">2+</div>
                  <div className="font-label-sm text-on-surface-variant uppercase">Products</div>
                </div>
                <div>
                  <div className="font-headline-md text-primary">5</div>
                  <div className="font-label-sm text-on-surface-variant uppercase">Services</div>
                </div>
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDj97xV3_kPLtsxNw7fMTX-ryF0TvJqdMxWAzNNLQ5kRHaOAcgPD5FgI2CLOru6qxOFVEe5FdvOwQ4UWr8qIkFC7HYYJedIBJLAe3MOBZPsUcIivK7cxwAt9mKDMHpNx05cZ4HUsVT1J-dXuCa7YpVrHCKBce4q2irfBPIMgjHQLLRP5XTG3jJZBcNxuTyExLvnaSCzj-I2hdV3XCWzVlL13XThVCg1oOqh5s1eukRhSHaRyMaJ_sqlBXooNibiuss7aAggi7IQHAo" alt="Pholar Natural hero" />
                <div className="absolute bottom-6 left-6 right-6 p-6 glass-effect rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-label-sm text-primary mb-1">Featured Routine</p>
                    <h3 className="font-headline-md text-on-surface">Botanical Glow</h3>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-secondary shadow-md">
                    <Play className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div 
                className="absolute -top-12 -right-12 w-48 h-48 bg-secondary-container/30 rounded-full parallax-blob"
                style={{ transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)` }}
              />
              <div 
                className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary-container/10 rounded-full parallax-blob"
                style={{ transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px)`, animationDelay: '-5s' }}
              />
            </div>
          </div>
        </section>

        {/* Products Showcase */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-5 md:px-16">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                <span className="font-label-sm text-secondary uppercase tracking-widest">Our Shop</span>
                <h2 className="font-headline-lg text-headline-lg text-primary mt-2">Pure ingredients, real results.</h2>
              </div>
              <a className="font-label-sm text-primary flex items-center gap-2 group" href="#">
                View All Products
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Product Card 1 */}
              <div className="tilt-card bg-white rounded-3xl overflow-hidden p-4">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 group">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-cjKLdTY8i_B_dPLPo5FaF8OF2_LGYaTnNHBVbwzhTrhIxgT4prwwxf8cKjFahryRMojUeP4q31ur4s4nCFw0xSu9HJ3nKaFTeoiy1aH1LdSl65HeN3Jt7XLqlzMTwCO_oNJbLmMctnOUTWXAzGro5fc1zY8v62GMqpJ9LPCDRIJO75Wv5e8vKLNFcw856h9oW_lmUEFP77RGDuJOOKnBPREN489fNBGzJAcrzXGQgIosqFw06RA_85t5ak16oR7gegfvsrF5DB0" alt="Restorative Hair Oil" />
                  <div className="absolute top-4 right-4 glass-effect px-3 py-1 rounded-full text-label-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    4.9
                  </div>
                </div>
                <div className="px-2">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline-md text-on-surface">Restorative Hair Oil</h3>
                    <span className="font-body-md font-bold text-primary">CAD $25.00</span>
                  </div>
                  <div className="flex gap-2 mb-6">
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-on-surface-variant uppercase">30ml</span>
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-on-surface-variant uppercase">Organic</span>
                  </div>
                  <button className="w-full bg-surface-container-highest text-primary py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
                    <Plus className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Product Card 2 */}
              <div className="tilt-card bg-white rounded-3xl overflow-hidden p-4">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 group">
                  <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgBfGFGNHRFbAMzLNqudgKLKv-f4EIH7uinxL3wcx0ZePAdKPxit8HDFgI2Fogp0-C9GfGgljjvQyorobwrUuYo-NC6oygM8vvftjumY5zKQVE9fNLDhPrbLKHlwgDt4NNI8CFBjMjRh5xH6cB2Bl_BzG8hNrzDecl90loWt5bX7GrEIXNyn7iNMtDjjJBZ9tQ3ouTXy0o9TpCnZCMGa6p8XkDhe9Ffx5D3aetA2KNIF_ywZQN59pJvWnWyDyzAwy9Mv1M4w07KOU" alt="Botanical Cleanse" />
                  <div className="absolute top-4 right-4 glass-effect px-3 py-1 rounded-full text-label-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    5.0
                  </div>
                </div>
                <div className="px-2">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-headline-md text-on-surface">Botanical Cleanse</h3>
                    <span className="font-body-md font-bold text-primary">CAD $20.00</span>
                  </div>
                  <div className="flex gap-2 mb-6">
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-on-surface-variant uppercase">250ml</span>
                    <span className="px-3 py-1 bg-surface-container-high rounded-full text-[10px] font-bold text-on-surface-variant uppercase">Sulfate-Free</span>
                  </div>
                  <button className="w-full bg-surface-container-highest text-primary py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all">
                    <Plus className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Certification Card */}
              <div className="hidden lg:flex flex-col justify-center p-6 bg-primary-container text-white rounded-3xl relative overflow-hidden">
                <div className="z-10">
                  <h3 className="font-headline-lg text-white mb-4 leading-snug">The 100% Organic Promise</h3>
                  <p className="font-body-md opacity-90 mb-8">Every ingredient we source is meticulously tested to ensure tradition meets quality.</p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <Verified className="w-5 h-5 text-secondary-container" />
                      <span>Eco-Certified Ingredients</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Verified className="w-5 h-5 text-secondary-container" />
                      <span>Ethically Hand-Harvested</span>
                    </li>
                  </ul>
                </div>
                <div className="absolute -right-16 -bottom-16 w-48 h-48 border-[24px] border-white/5 rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Services Preview */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-5 md:px-16">
            <div className="text-center mb-12">
              <span className="font-label-sm text-secondary uppercase tracking-widest">Professional Services</span>
              <h2 className="font-headline-lg text-headline-lg text-primary mt-2">Beauty treatments crafted for you</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { name: 'Didi Olowo', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDut2sr_FMOKlrT6x2qQWWk4bzZZU89tOf6eJSNku_jSx9Hbz40lOoULhL_w3r1CgFX9DVJFwuQ4udEOEgMgfkLXVG-fbTMNf4QM4CI8DQTvEbveq-j5746Fot0QqeDt8oEKM1nvcip3FAEGyjxBy27fubmgBmz4rA1vBrGKOLCic_6z8bPGOj7eO2eFhws7IVK6DGVasvdtrmPOO1mLBEc9SVpaIhpQlTtE1v6a24p1Z2HQ4MCDAslDhZh13qzQJ22Voj1_u-hDK4' },
                { name: 'Kiko', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeItpqUWJkO6PPj_7qW7NciBl9kP5eZpgShcGCxi4CtmhV0J72-6A7EohrO2X3FpIf2ENaSfqBW3y82VGQlEnXOFWVcpC0vjBRlI2ODL-alTPqt_AcLqknqjwJ4pvdevHPH2qCyP_pg9KDDg2TyVALQBDBzAe-sg--GrW6UxP_Yrv698oqTuXl9okhMaHmKy3XFn60uf5XcDHpyV8GtNaiBkQGZBwQ1yfEoI-FW2XElpgXRLYerZAarjIQJM3YUSIiQZCvXY8sSo4' },
                { name: 'Wash & Set', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDW0HFlP3FWXhJ0GxGyJgT2gxxp4FqQTKJRXgLRXIHud59n5yI02Lq_kPqq7sJO8QSnEjX5n9KlkNJRrpHBqOmq52uh13mNHwGwzLvfdMKR5IWR2_BPegJp9X0UsYT92iGfOTrldrUWEUR3wFy7hpByXVTWlV84Egwtdtc-77FTWq3uERosc5jBUoGYM0QmuxNalYGHkKDmrJVbdgiXrOcF2hMNNLQWqu0a1bKLdVUGrrO8FYxvNwJmzzRVh_a5iyPKImEGV_2osCo' },
                { name: 'Hair Treatment', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE46clyf_wzuA7P_WfV8ULBY5kxZqstASW5MD90IL31iOmE7frbM0IC2gNRfwlAXx3tlSVUeSnDLmgdZNGEZi92ENVyKqolxSrWnmN_h-NSS_Ur992RbuVtZuD9trypuVLhf-9TCqO73jN_UdQrsgFVks671YptzLE5YlwAyWj211nqN_YBIV85eRTxg6Geifjs9sN4AEja8HeChVAZIxSeviir_SH41Frs-KWbN7YHCnv-TfGA7C7yC0szOLVihd1yz0XvOWLVW4' },
                { name: 'Hair Waxing', src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAU6cYpskzFHb_aWIuZy7KQ9d3idJq4p0HDagJZHGgZyVEviWCX-Wt1F0VOejMw8BU_CSzevFrXTaU7VbsAxQaZnVnJePltbxZqNy7QGDYcMuWnhE4UmDEqEPYD67Rn-AEZKdp-cKYnkfIkcd5GYxrG9f5h_1jHPYrk8eOc5XFL4pm_PyhOZP-K8X1taUoITC30fVdUNOviFYz6w1snaoF_F-eUsK6Evby3mP6WTNuKzuyTcGVIbgiCslmKQoKN0Vfw1oxJQ1qeppo' },
              ].map((service, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-4 relative">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" src={service.src} alt={service.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <h4 className="text-white font-headline-md text-body-md">{service.name}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Preview */}
        <section className="py-16 bg-surface-container">
          <div className="max-w-7xl mx-auto px-5 md:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <img className="rounded-3xl shadow-lg mt-6 h-64 w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD85AjGhEYXncMVckH-jDtP9dBygDJZgcxTw7umC1jmXVdl45o1zQQ3pLW8cQ7O2xq2zNSzdfp1zf_37m3NCV5YjiNsLapGy8VqSOlb8ueWYHPO1JtYYKERnZkHUBHtAKzIde82FDrGcn7OJv1kDhYg437VlBkT0-vqjhAK4OGtCKnby_9z83eC6P0YYQfmIGFobIxR3uOh419lUYAPTUI3-6Y6thIiqdS58KpABJqWX819BDX5ZRtYeEnoTHm8T3ckznY4hAZPRlM" alt="Botanical ingredients" />
                  <img className="rounded-3xl shadow-lg mb-6 h-64 w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_iNbjZWVfKDwHsPf66fUmaTJvBbmuOPbrQplhmkpiy1Gx21FMejSiDkQZqpEIdhMWdAGyM5qD2TWpz3DCOLbRgSkULtrgH_WK2xWWduUdOy5Dt0FgNEv6gjZEXU-oaHi4ySA4QBqPES4SvtcDgwKF2634kWTUunQjyGVFzQ8Q6YUOh5pDORduXFMsg7Z0NQzCJCpbEpz2Hirc6Nm1haKEO94i_LwjnqdpgINIQCh7cuE25y-Tkqf-oYN5EPZ9Yz3CUrO66UD2P4o" alt="Traditional mortar and pestle" />
                </div>
              </div>
              <div>
                <span className="font-label-sm text-secondary uppercase tracking-widest">Our Story</span>
                <h2 className="font-headline-lg text-headline-lg text-primary mt-2 mb-6">Haircare rooted in nature and tradition</h2>
                <p className="font-body-lg text-on-surface-variant mb-6">
                  Born from a desire to reclaim traditional African beauty rituals, Pholar Natural combines hand-harvested botanicals with modern science. We believe that what goes on your crown should be as pure as the nature it comes from.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-primary-container/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🌿</span>
                    </div>
                    <h4 className="font-label-sm font-bold uppercase">100% Natural</h4>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-primary-container/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🐾</span>
                    </div>
                    <h4 className="font-label-sm font-bold uppercase">Cruelty Free</h4>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-primary-container/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🌱</span>
                    </div>
                    <h4 className="font-label-sm font-bold uppercase">Sustainable</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-5 md:px-16">
            <div className="text-center mb-12">
              <h2 className="font-headline-lg text-headline-lg text-primary">Loved by our community</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'Amina J.', text: '"The Restorative Hair Oil changed my hair game completely. My edges have never looked fuller!"', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDquwcrEX_8lDM_u8Na1u52ZJSXruiDy6GfYqdZ4WXhZII5oJcErL-UJV6NGFdFVrPBF68xQVHEIhgw8jC0x23bPXGs_e5--sdSmvkmgH2zh1xcbgP2Sql1jXKbA9fjx-pgLV0E009n-fPxXuXIQEcLUKezAKMiSSXpJI7SNHDqNzX1jJ1DcwM-5PZnTzfBiXXhCNJWm2toVVZJDqPU1T7nATaWcGDaPWU8rxvpwHRptfawJ4e-1ESFD9bWlwFvmXf9t4tDmpjMUhk' },
                { name: 'Sarah K.', text: '"Finding Pholar was a blessing. Their Botanical Cleanse doesn\'t strip my hair, it feels so soft."', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcu5KhZjB5j1BRkw2DUWw-aYmn9Xp6mIco5jon8YR2YY0qZSQyLC7GZsTRq1DlAh6nsggnU4beL0BeNdiKvIBLDeW0hdmgV2zWAxlXiCmLXzDz5NvKoBcUhchLz9ubHlWQZT5SlMRGSkmDIB_RIERHk8HXygqBITgYLychEAhMN_4fVAc8oZyPGFxsDLJWEwgYdGyy-BIw8iy4RdZJhn_gz6Db7Yfw4Sa1ipc_JveqMcMpwwLKDrKsHHh9edT6cRNw2fCdmyM5EZQ' },
                { name: 'Fatima L.', text: '"The Didi Olowo service was handled with so much care. I\'ve never felt more connected to my roots."', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8FdnPBdmJ2GGKjL2BZsAseAD5wq_1hk_kcMCpttxSR-nEx33cMVzGr2EK4Bi8UEe4QVU4wZKNuzhPtE3GxAw9G_gXDA6YMY1gTPHbWtrOXx3WHcGZQTK_8mqBK1ovkBe5CsiiJVbD_iP6nHIdAKYDmcQ6hfnjTvzi2p7uMCj9v8A2CMcXzRgVOoMhchJPgQXUhDeQJ25anO37OQSObGQkbaCH7HCTMYVYRhR_mVse2FgHd0ARlzyycvtHkTxvHcryitNrV_zYbWo' },
              ].map((testimonial, i) => (
                <div key={i} className="bg-surface-container-low p-6 rounded-3xl relative">
                  <div className="flex items-center gap-1 text-secondary mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="font-body-md text-on-surface mb-6 italic">{testimonial.text}</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-dim overflow-hidden">
                      <img className="w-full h-full object-cover" src={testimonial.avatar} alt={testimonial.name} />
                    </div>
                    <div>
                      <p className="font-label-sm font-bold text-primary">{testimonial.name}</p>
                      <span className="text-[10px] uppercase font-bold text-secondary">Loyal Client</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-16 overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 md:px-16 text-center z-10 relative">
            <div className="bg-primary py-16 rounded-[40px] px-6 text-white">
              <h2 className="font-headline-display text-headline-lg-mobile md:text-headline-display mb-6">Your hair deserves the best</h2>
              <p className="font-body-lg opacity-90 mb-6 max-w-xl mx-auto">Join the thousands who have transformed their crown with our organic rituals. Start your journey today.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button className="bg-secondary text-white px-10 py-4 rounded-full font-label-sm hover:scale-105 transition-all">Shop All Products</button>
                <button className="bg-white text-primary px-10 py-4 rounded-full font-label-sm hover:scale-105 transition-all">Book Appointment</button>
              </div>
            </div>
          </div>
          <div 
            className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-secondary/10 parallax-blob"
            style={{ transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * 0.2}px)` }}
          />
          <div 
            className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary-container/10 parallax-blob"
            style={{ transform: `translate(${mousePos.x * -0.2}px, ${mousePos.y * -0.2}px)`, animationDelay: '-10s' }}
          />
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-5 md:px-16 py-16 max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
                PN
              </div>
              <span className="font-headline-md text-primary font-bold">Pholar Natural</span>
            </div>
            <p className="font-body-md text-on-surface-variant">Bridging the gap between raw African tradition and premium clinical-grade organic beauty.</p>
            <div className="flex gap-4">
              <a className="text-primary hover:text-secondary transition-all" href="#">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a className="text-primary hover:text-secondary transition-all" href="#">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                </svg>
              </a>
              <a className="text-primary hover:text-secondary transition-all" href="#"><Mail className="w-5 h-5" /></a>
            </div>
          </div>
          <div>
            <h4 className="font-label-sm font-bold text-primary mb-6 uppercase">Shop</h4>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-secondary transition-all" href="#">Hair Oils</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-all" href="#">Shampoos</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-all" href="#">Gift Cards</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-all" href="#">Bundle Deals</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-sm font-bold text-primary mb-6 uppercase">Support</h4>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-secondary transition-all" href="#">Shipping Info</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-all" href="#">Privacy Policy</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-all" href="#">Contact Us</a></li>
              <li><a className="text-on-surface-variant hover:text-secondary transition-all" href="#">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-sm font-bold text-primary mb-6 uppercase">Newsletter</h4>
            <p className="font-body-md text-on-surface-variant mb-4">Sign up for natural hair tips and exclusive drops.</p>
            <form className="flex flex-col gap-2">
              <input 
                className="bg-surface border-outline-variant rounded-xl px-4 py-3 focus:ring-primary focus:border-primary" 
                placeholder="Your email" 
                type="email" 
              />
              <button className="bg-primary text-white py-3 rounded-xl font-label-sm hover:opacity-90 transition-all">Subscribe</button>
            </form>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-5 md:px-16 py-4 border-t border-outline-variant/30 text-center">
          <p className="text-on-surface-variant text-[12px] opacity-70">© 2024 Pholar Natural. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}