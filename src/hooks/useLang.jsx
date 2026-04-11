import { createContext, useContext, useState } from 'react'

const LangContext = createContext(null)

const translations = {
  fr: {
    // ── Header ──
    menu: 'Menu',
    login: 'Connexion',
    myAccount: 'Mon compte',

    // ── Home page ──
    heroEyebrow: '11 Rue de Berri · Paris 8e',
    heroSub: 'Cuisine Chinoise & Thaïlandaise raffinée\naux portes des Champs-Élysées',
    viewMenu: 'Voir le menu',
    hoursLabel: 'Lun–Dim · 11h–14h & 18h–23h',
    cashbackStrip: '10% cashback sur chaque commande',
    feat1Title: 'Commander en ligne',
    feat1Desc: 'Scannez le QR code à votre table, choisissez vos plats et payez en un clic.',
    feat2Title: 'Balance Cashback',
    feat2Desc: '10% de vos dépenses sont crédités sur votre compte et utilisables à la prochaine visite.',
    feat3Title: 'Vos avis comptent',
    feat3Desc: 'Après chaque repas, aidez-nous à progresser en laissant votre avis sur Google.',

    // ── Menu page ──
    loading: 'Chargement du menu…',
    wineNote: 'Carte des vins et boissons alcoolisées disponible auprès du serveur',
    viewCart: 'Voir mon panier',

    // ── Cart ──
    cartTitle: 'Mon Panier',
    cartEmpty: 'Votre panier est vide',
    browseMenu: 'Parcourir le menu',
    subtotal: 'Sous-total',
    cashbackEarn: (amount) => `Vous gagnerez ${amount} de cashback`,
    order: 'Commander',
    clearCart: 'Vider le panier',

    // ── Checkout ──
    checkoutTitle: 'Récapitulatif de commande',
    yourDishes: 'Vos plats',
    info: 'Informations',
    tableNumber: 'Numéro de table (optionnel)',
    tablePlaceholder: 'ex: 12',
    notes: 'Remarques (allergies, etc.)',
    notesPlaceholder: 'ex: sans gluten, pas trop épicé…',
    useBalance: 'Utiliser mon solde Balance',
    balanceAvailable: (amount) => `Disponible : ${amount}`,
    balanceDeducted: (amount) => `− ${amount} déduit du solde`,
    loginForCashback: (amount) => `pour utiliser votre Balance et cumuler ${amount} de cashback`,
    connect: 'Connectez-vous',
    balanceApplied: 'Balance appliquée',
    totalToPay: 'Total à payer',
    cashbackOnOrder: (amount) => `Vous gagnerez ${amount} de cashback sur cette commande`,
    processing: 'Traitement…',
    payBalance: 'Confirmer (Balance)',
    pay: (amount) => `Payer ${amount}`,
    emptyCart: 'Votre panier est vide.',
    backToMenu: 'Retour au menu',
    editOrder: '← Modifier ma commande',

    // ── Payment success ──
    confirmed: 'Commande confirmée !',
    orderNumber: 'Numéro de commande',
    waitHint: 'Veuillez patienter, nous préparons vos plats',
    paid: 'Payé',
    balanceUsed: 'Balance utilisée',
    cashbackEarned: (amount) => `+${amount} de cashback gagné !`,
    cashbackCredited: (balance) => `Crédité sur votre compte · Solde actuel : ${balance}`,
    loginForCashbackSuccess: (amount) => `Connectez-vous pour gagner ${amount} de cashback !`,
    createAccount: 'Créer un compte →',
    howWasIt: 'Comment était votre expérience ?',
    reviewSub: "Votre avis aide d'autres gourmets à découvrir notre restaurant.",
    leaveReview: 'Laisser un avis sur Google',
    newOrder: 'Passer une nouvelle commande',

    // ── Account login ──
    myAccountTitle: 'Mon Compte',
    loginSubEmail: 'Entrez votre adresse e-mail pour vous connecter ou créer un compte.',
    loginSubOtp: (email) => `Code envoyé à ${email} — vérifiez vos spams si besoin.`,
    otpHint: 'Code à 6 chiffres envoyé par e-mail',
    emailPlaceholder: 'votre@email.com',
    sendCode: 'Recevoir mon code →',
    sending: 'Envoi…',
    verifyCode: 'Valider le code →',
    verifying: 'Vérification…',
    resendIn: (s) => `Renvoyer dans ${s}s`,
    resend: 'Renvoyer le code',
    changeEmail: "Changer d'adresse",
    loginFooter: 'Pas de compte ? En vous connectant, un compte est créé automatiquement.',

    // ── Account dashboard ──
    balanceSub: 'Utilisable sur votre prochaine commande',
    txHistory: 'Historique des transactions',
    txLoading: 'Chargement…',
    txEmpty: "Aucune transaction pour l'instant.",
    logout: 'Se déconnecter',

    // ── Checkout delivery ──
    orderTypeDineIn: 'Sur place',
    orderTypeDelivery: 'Livraison',
    deliveryAddress: 'Adresse de livraison *',
    deliveryAddressPlaceholder: '15 rue de Berri, 75008 Paris',
    deliveryPhone: 'Téléphone *',
    deliveryPhonePlaceholder: '06 12 34 56 78',
    deliveryInstructions: 'Instructions (optionnel)',
    deliveryInstructionsPlaceholder: '3ème étage, code 1234…',
    deliveryFee: 'Frais de livraison',
    deliverySection: 'Informations de livraison',

    // ── Kitchen ──
    kitchenPreparing: 'En préparation',
    kitchenReady: 'Prêt — À récupérer',
    kitchenDone: 'Terminé',
    kitchenTable: 'Table',
    kitchenDelivery: 'Livraison',
    kitchenNoOrders: 'Aucune commande en attente',
    kitchenNoReady: 'Aucun plat prêt',
    kitchenMarkReady: '✓ Prêt',
    kitchenMarkDone: '✓ Remis',

    // ── Admin ──
    adminTitle: 'Administration',
    adminOrders: 'Commandes',
    adminRevenue: 'Chiffre d\'affaires',
    adminCashback: 'Cashback distribué',
    adminDineIn: 'Sur place',
    adminDelivery: 'Livraison',
    adminBalance: 'Balance seule',
    adminAllStatuses: 'Tous statuts',

    // ── Delivery panel ──
    deliveryTitle: 'Livraisons en cours',
    deliveryPickup: '📦 Récupéré',
    deliveryDelivered: '✅ Livré',
    deliveryCall: '📞 Appeler',
    deliveryNoOrders: 'Aucune livraison en cours',
    deliveryWaiting: 'En attente',
    deliveryEnRoute: 'En route',
  },

  zh: {
    // ── Header ──
    menu: '菜单',
    login: '登录',
    myAccount: '我的账户',

    // ── Home page ──
    heroEyebrow: '巴黎香榭丽舍旁 · 11 Rue de Berri',
    heroSub: '精致中法泰三国料理\n巴黎香榭丽舍旁的高端中餐厅',
    viewMenu: '查看菜单',
    hoursLabel: '周一至周日 · 11h–14h & 18h–23h',
    cashbackStrip: '每单消费10%返点到账户',
    feat1Title: '在线点餐',
    feat1Desc: '扫描桌上二维码，选菜、下单、支付一步完成。',
    feat2Title: '余额返现',
    feat2Desc: '每次消费10%自动返点，下次到店直接抵扣。',
    feat3Title: '您的评价很重要',
    feat3Desc: '用餐后在Google地图留下评价，帮助更多食客发现我们。',

    // ── Menu page ──
    loading: '菜单加载中…',
    wineNote: '酒水单请咨询服务员',
    viewCart: '查看购物车',

    // ── Cart ──
    cartTitle: '购物车',
    cartEmpty: '购物车为空',
    browseMenu: '浏览菜单',
    subtotal: '小计',
    cashbackEarn: (amount) => `将获得 ${amount} 返点`,
    order: '去结账',
    clearCart: '清空购物车',

    // ── Checkout ──
    checkoutTitle: '订单确认',
    yourDishes: '已选菜品',
    info: '用餐信息',
    tableNumber: '桌号（可选）',
    tablePlaceholder: '例：12',
    notes: '备注（过敏、口味等）',
    notesPlaceholder: '例：不要太辣，不含麸质…',
    useBalance: '使用余额抵扣',
    balanceAvailable: (amount) => `可用余额：${amount}`,
    balanceDeducted: (amount) => `已抵扣 ${amount}`,
    loginForCashback: (amount) => `以使用余额并获得 ${amount} 返点`,
    connect: '请登录',
    balanceApplied: '余额抵扣',
    totalToPay: '实付金额',
    cashbackOnOrder: (amount) => `本单将获得 ${amount} 返点`,
    processing: '处理中…',
    payBalance: '确认（余额支付）',
    pay: (amount) => `支付 ${amount}`,
    emptyCart: '购物车为空。',
    backToMenu: '返回菜单',
    editOrder: '← 修改订单',

    // ── Payment success ──
    confirmed: '订单已确认！',
    orderNumber: '取餐号',
    waitHint: '请稍候，我们正在为您准备',
    paid: '实付',
    balanceUsed: '余额抵扣',
    cashbackEarned: (amount) => `+${amount} 返点到账！`,
    cashbackCredited: (balance) => `已存入账户 · 当前余额：${balance}`,
    loginForCashbackSuccess: (amount) => `登录后可获得 ${amount} 返点！`,
    createAccount: '立即注册 →',
    howWasIt: '用餐体验如何？',
    reviewSub: '您的评价帮助更多食客发现我们的餐厅。',
    leaveReview: '在Google Maps上评价',
    newOrder: '继续点餐',

    // ── Account login ──
    myAccountTitle: '我的账户',
    loginSubEmail: '输入邮箱登录或创建账户。',
    loginSubOtp: (email) => `验证码已发送至 ${email}，请查收（注意垃圾邮件）。`,
    otpHint: '6位数字验证码已发送至邮箱',
    emailPlaceholder: '您的邮箱地址',
    sendCode: '获取验证码 →',
    sending: '发送中…',
    verifyCode: '验证并登录 →',
    verifying: '验证中…',
    resendIn: (s) => `${s}秒后重新发送`,
    resend: '重新发送验证码',
    changeEmail: '更换邮箱',
    loginFooter: '没有账户？登录时将自动创建。',

    // ── Account dashboard ──
    balanceSub: '可在下次消费时使用',
    txHistory: '交易记录',
    txLoading: '加载中…',
    txEmpty: '暂无交易记录。',
    logout: '退出登录',

    // ── Checkout delivery ──
    orderTypeDineIn: '堂食',
    orderTypeDelivery: '外送',
    deliveryAddress: '配送地址 *',
    deliveryAddressPlaceholder: '15 rue de Berri, 75008 Paris',
    deliveryPhone: '联系电话 *',
    deliveryPhonePlaceholder: '06 12 34 56 78',
    deliveryInstructions: '配送说明（可选）',
    deliveryInstructionsPlaceholder: '3楼，门码1234…',
    deliveryFee: '配送费',
    deliverySection: '配送信息',

    // ── Kitchen ──
    kitchenPreparing: '待制作',
    kitchenReady: '请取餐',
    kitchenDone: '已完成',
    kitchenTable: '桌号',
    kitchenDelivery: '外送',
    kitchenNoOrders: '暂无待制作订单',
    kitchenNoReady: '暂无已完成订单',
    kitchenMarkReady: '✓ 完成',
    kitchenMarkDone: '✓ 已取',

    // ── Admin ──
    adminTitle: '管理后台',
    adminOrders: '订单',
    adminRevenue: '营业额',
    adminCashback: '返点发放',
    adminDineIn: '堂食',
    adminDelivery: '外送',
    adminBalance: '纯余额支付',
    adminAllStatuses: '全部状态',

    // ── Delivery panel ──
    deliveryTitle: '外送订单',
    deliveryPickup: '📦 已取餐',
    deliveryDelivered: '✅ 已送达',
    deliveryCall: '📞 拨打',
    deliveryNoOrders: '暂无外送订单',
    deliveryWaiting: '等待取餐',
    deliveryEnRoute: '配送中',
  },
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState('fr')
  const toggle = () => setLang(l => l === 'fr' ? 'zh' : 'fr')

  const t = (key, ...args) => {
    const val = translations[lang][key]
    if (typeof val === 'function') return val(...args)
    return val ?? key
  }

  // Primary name in current lang; secondary = the other lang
  const name = (item) => item?.[`name_${lang}`] || item?.name_fr || ''
  const altName = (item) => item?.[lang === 'fr' ? 'name_zh' : 'name_fr'] || ''

  return (
    <LangContext.Provider value={{ lang, toggle, t, name, altName }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
