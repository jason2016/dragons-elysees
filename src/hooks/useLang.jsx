import { createContext, useContext, useState } from 'react'

const LangContext = createContext(null)

// All UI strings — add keys as needed
const translations = {
  fr: {
    // Nav
    menu: 'Menu',
    login: 'Connexion',
    myAccount: 'Mon compte',
    // Menu page
    loading: 'Chargement du menu…',
    wineNote: 'Carte des vins et boissons alcoolisées disponible auprès du serveur',
    viewCart: 'Voir mon panier',
    // Cart
    cartTitle: 'Mon Panier',
    cartEmpty: 'Votre panier est vide',
    browseMenu: 'Parcourir le menu',
    subtotal: 'Sous-total',
    cashbackEarn: (amount) => `Vous gagnerez ${amount} de cashback`,
    order: 'Commander',
    clearCart: 'Vider le panier',
    // Checkout
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
    // Payment success
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
    // Account login
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
    // Account dashboard
    balanceSub: 'Utilisable sur votre prochaine commande',
    txHistory: 'Historique des transactions',
    txLoading: 'Chargement…',
    txEmpty: 'Aucune transaction pour l\'instant.',
    logout: 'Se déconnecter',
  },
  zh: {
    menu: '菜单',
    login: '登录',
    myAccount: '我的账户',
    loading: '菜单加载中…',
    wineNote: '酒水单请咨询服务员',
    viewCart: '查看购物车',
    cartTitle: '购物车',
    cartEmpty: '购物车为空',
    browseMenu: '浏览菜单',
    subtotal: '小计',
    cashbackEarn: (amount) => `将获得 ${amount} 返点`,
    order: '去结账',
    clearCart: '清空购物车',
    checkoutTitle: '订单确认',
    yourDishes: '已选菜品',
    info: '用餐信息',
    tableNumber: '桌号（可选）',
    tablePlaceholder: '例：12',
    notes: '备注（过敏、口味等）',
    notesPlaceholder: '例：不要太辣，不含麸质…',
    useBalance: '使用余额抵扣',
    balanceAvailable: (amount) => `可用：${amount}`,
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
    balanceSub: '可在下次消费时使用',
    txHistory: '交易记录',
    txLoading: '加载中…',
    txEmpty: '暂无交易记录。',
    logout: '退出登录',
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
  // Helper: pick the right name field
  const name = (item) => item?.[`name_${lang}`] || item?.name_fr || ''

  return (
    <LangContext.Provider value={{ lang, toggle, t, name }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}
