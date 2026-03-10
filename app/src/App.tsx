import { useEffect, useMemo, useRef, useState } from 'react'

type SceneMode = 'home' | 'quick'
type PhotoStatus = 'generating' | 'ready' | 'claimed'
type ChatRole = 'user' | 'assistant'

type FurnitureTemplate = {
  id: string
  name: string
  category: string
  style: string
  reason: string
  zone: PlacementZone
  tone: string
  accent: string
  size: 'sm' | 'md' | 'lg'
}

type FurnitureItem = FurnitureTemplate & {
  placementId: string
  source: 'starter' | 'recommendation' | 'photo' | 'assistant'
}

type PhotoItem = {
  id: string
  name: string
  status: PhotoStatus
  tone: string
  accent: string
  category: string
}

type ChatMessage = {
  id: string
  role: ChatRole
  text: string
}

type PlacementZone = 'center' | 'leftWall' | 'rightWall' | 'window' | 'bedside' | 'foot'

type Placement = {
  id: string
  zone: PlacementZone
  left: string
  top: string
  width: string
  depth: string
  rotate: string
}

const PLACEMENTS: Placement[] = [
  { id: 'bed-center', zone: 'center', left: '31%', top: '40%', width: '28%', depth: '19%', rotate: '-18deg' },
  { id: 'bedside-left', zone: 'bedside', left: '21%', top: '43%', width: '10%', depth: '10%', rotate: '-15deg' },
  { id: 'bedside-right', zone: 'bedside', left: '58%', top: '45%', width: '10%', depth: '10%', rotate: '-15deg' },
  { id: 'left-wall-low', zone: 'leftWall', left: '14%', top: '56%', width: '16%', depth: '12%', rotate: '-14deg' },
  { id: 'left-wall-high', zone: 'leftWall', left: '17%', top: '31%', width: '15%', depth: '11%', rotate: '-14deg' },
  { id: 'right-wall-low', zone: 'rightWall', left: '67%', top: '54%', width: '16%', depth: '12%', rotate: '-20deg' },
  { id: 'right-wall-high', zone: 'rightWall', left: '64%', top: '32%', width: '15%', depth: '11%', rotate: '-20deg' },
  { id: 'window-bench', zone: 'window', left: '45%', top: '24%', width: '18%', depth: '10%', rotate: '-18deg' },
  { id: 'foot-center', zone: 'foot', left: '40%', top: '61%', width: '20%', depth: '12%', rotate: '-18deg' }
]

const STARTER_FURNITURE: FurnitureItem[] = [
  {
    id: 'starter-bed',
    name: '云朵软床',
    category: '床',
    style: '奶油原木',
    reason: '首页默认核心家具',
    zone: 'center',
    tone: '#f5f0d8',
    accent: '#97f169',
    size: 'lg',
    placementId: 'bed-center',
    source: 'starter'
  },
  {
    id: 'starter-window',
    name: '暖光落地灯',
    category: '灯具',
    style: '暖感氛围',
    reason: '首页默认氛围光',
    zone: 'rightWall',
    tone: '#ffe39d',
    accent: '#112824',
    size: 'sm',
    placementId: 'right-wall-high',
    source: 'starter'
  }
]

const RECOMMENDATION_POOL: FurnitureTemplate[] = [
  { id: 'nightstand', name: '圆角床头柜', category: '床头柜', style: '奶油原木', reason: '补齐床边收纳', zone: 'bedside', tone: '#f3d7b6', accent: '#112824', size: 'sm' },
  { id: 'curtain', name: '柔纱窗帘', category: '窗帘', style: '轻透温柔', reason: '让房间更柔和', zone: 'window', tone: '#eef8ef', accent: '#97f169', size: 'md' },
  { id: 'rug', name: '云感地毯', category: '地毯', style: '暖感层次', reason: '填补床尾空区', zone: 'foot', tone: '#f9e7c8', accent: '#97f169', size: 'lg' },
  { id: 'desk', name: '漂浮书桌', category: '书桌', style: '轻学习角', reason: '完善学习区', zone: 'leftWall', tone: '#d7f3df', accent: '#112824', size: 'md' },
  { id: 'chair', name: '豆豆单椅', category: '椅子', style: '轻松陪伴', reason: '给书桌配座位', zone: 'leftWall', tone: '#ffe4c2', accent: '#112824', size: 'sm' },
  { id: 'plant', name: '猫薄荷绿植', category: '绿植', style: '自然点缀', reason: '给角落增加生命力', zone: 'window', tone: '#d2f6c9', accent: '#0b3e35', size: 'sm' },
  { id: 'wardrobe', name: '拼色衣柜', category: '衣柜', style: '整洁收纳', reason: '补齐收纳大件', zone: 'rightWall', tone: '#d9f1da', accent: '#112824', size: 'lg' },
  { id: 'art', name: '挂画组合', category: '装饰画', style: '轻艺术感', reason: '补足墙面层次', zone: 'leftWall', tone: '#e8f7c3', accent: '#112824', size: 'sm' },
  { id: 'bench', name: '床尾长凳', category: '长凳', style: '酒店感', reason: '提升完整度', zone: 'foot', tone: '#ead8b2', accent: '#112824', size: 'md' },
  { id: 'dresser', name: '奶油梳妆台', category: '梳妆台', style: '少女感', reason: '增加精致使用区', zone: 'rightWall', tone: '#fae7df', accent: '#112824', size: 'md' }
]

const PHOTO_SAMPLES = [
  '马克杯边桌',
  '行李箱矮柜',
  '耳机收纳架',
  '编织篮置物凳',
  '香薰角几',
  '玩偶抱枕凳'
]

const QUICK_CHIPS = ['换成奶油风', '加一个书桌', '把床靠墙', '窗帘换浅一点', '让房间更温馨']

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function pickPlacements(zone: PlacementZone, usedIds: Set<string>) {
  return PLACEMENTS.filter((placement) => placement.zone === zone && !usedIds.has(placement.id))
}

function choosePlacement(zone: PlacementZone, usedIds: Set<string>) {
  const candidates = pickPlacements(zone, usedIds)
  return candidates[0] ?? PLACEMENTS.find((placement) => !usedIds.has(placement.id)) ?? null
}

function buildRecommendations(scene: FurnitureItem[], count = 3) {
  const existingCategories = new Set(scene.map((item) => item.category))
  const byPriority = [...RECOMMENDATION_POOL].sort((left, right) => {
    const leftMissing = existingCategories.has(left.category) ? 1 : 0
    const rightMissing = existingCategories.has(right.category) ? 1 : 0
    return leftMissing - rightMissing
  })

  const selected: FurnitureTemplate[] = []
  const usedCategories = new Set<string>()

  for (const item of byPriority) {
    if (selected.length >= count) {
      break
    }
    if (usedCategories.has(item.category)) {
      continue
    }
    selected.push(item)
    usedCategories.add(item.category)
  }

  return selected
}

function App() {
  const [sceneMode, setSceneMode] = useState<SceneMode>('home')
  const [sceneItems, setSceneItems] = useState<FurnitureItem[]>(STARTER_FURNITURE)
  const [recommendations, setRecommendations] = useState<FurnitureTemplate[]>(() => buildRecommendations(STARTER_FURNITURE))
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([])
  const [captureOpen, setCaptureOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: nextId('chat'),
      role: 'assistant',
      text: '我会保留当前 3D 房间视图，你可以直接说“加一个书桌”“换成奶油风”或“把床靠墙”。'
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const activePackage = photoItems.find((item) => item.status === 'generating' || item.status === 'ready')
  const roomScore = Math.min(100, 28 + sceneItems.length * 10)

  const heroTip = useMemo(() => {
    if (sceneMode === 'home') {
      return '拍个身边的小物件，我帮你放进房间'
    }
    if (activePackage?.status === 'ready') {
      return '快递做好啦，点一下签收，我帮你找好位置'
    }
    return '我刚根据房间状态换了一批更合适的家具'
  }, [activePackage?.status, sceneMode])

  function refreshRecommendations(nextScene: FurnitureItem[]) {
    setRecommendations(buildRecommendations(nextScene))
  }

  function addFurniture(template: FurnitureTemplate, source: FurnitureItem['source']) {
    setSceneItems((current) => {
      const used = new Set(current.map((item) => item.placementId))
      const placement = choosePlacement(template.zone, used)
      if (!placement) {
        return current
      }

      const next: FurnitureItem[] = [
        ...current,
        {
          ...template,
          placementId: placement.id,
          source
        }
      ]
      refreshRecommendations(next)
      return next
    })
  }

  function handleOpenQuickAdd() {
    setSceneMode('quick')
  }

  function handlePhotoCapture() {
    if (photoItems.length >= 4) {
      window.alert('待处理物品已满 4 个，请先摆放或收入背包。')
      return
    }
    setCaptureOpen(true)
  }

  function confirmPhotoCapture() {
    const index = Math.floor(Math.random() * PHOTO_SAMPLES.length)
    const name = PHOTO_SAMPLES[index]
    const item: PhotoItem = {
      id: nextId('photo'),
      name,
      status: 'generating',
      tone: ['#ffdcb4', '#d8f4ca', '#f7e9ca', '#dbf6ef'][index % 4],
      accent: ['#112824', '#0b3e35', '#97f169', '#112824'][index % 4],
      category: '用户图转 3D'
    }

    setCaptureOpen(false)
    setSceneMode('quick')
    setPhotoItems((current) => [...current, item])

    const readyTimer = window.setTimeout(() => {
      setPhotoItems((current) =>
        current.map((photo) => (photo.id === item.id ? { ...photo, status: 'ready' } : photo))
      )
    }, 6500)

    timersRef.current.push(readyTimer)
  }

  function claimPhoto(itemId: string) {
    setPhotoItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, status: 'claimed' } : item))
    )
  }

  function placePhoto(item: PhotoItem) {
    const template: FurnitureTemplate = {
      id: item.id,
      name: item.name,
      category: item.category,
      style: '现实灵感',
      reason: '由用户拍照生成',
      zone: 'foot',
      tone: item.tone,
      accent: item.accent,
      size: 'md'
    }

    const used = new Set(sceneItems.map((sceneItem) => sceneItem.placementId))
    const placement = choosePlacement('foot', used) ?? choosePlacement('leftWall', used)
    if (!placement) {
      window.alert('当前场景没有合适空位，建议先收入背包。')
      return
    }

    setSceneItems((current) => {
      const next: FurnitureItem[] = [
        ...current,
        {
          ...template,
          placementId: placement.id,
          source: 'photo'
        }
      ]
      refreshRecommendations(next)
      return next
    })
    setPhotoItems((current) => current.filter((photo) => photo.id !== item.id))
  }

  function stashPhoto(itemId: string) {
    setPhotoItems((current) => current.filter((item) => item.id !== itemId))
  }

  function takeRecommendation(item: FurnitureTemplate) {
    addFurniture(item, 'recommendation')
  }

  function applyAssistantIntent(rawText: string) {
    const text = rawText.trim()
    if (!text) {
      return
    }

    const userMessage: ChatMessage = { id: nextId('chat'), role: 'user', text }
    const lowerText = text.toLowerCase()
    let assistantText = '我已经记住这个需求了，我会先在当前房间里做一版最稳妥的调整。'

    setChatMessages((current) => [...current, userMessage])

    if (text.includes('书桌')) {
      const template = RECOMMENDATION_POOL.find((item) => item.category === '书桌')
      if (template) {
        addFurniture(template, 'assistant')
      }
      assistantText = '我补了一张更轻盈的书桌，并把它放到了左侧学习区。'
    } else if (text.includes('奶油风') || text.includes('温馨') || lowerText.includes('cream')) {
      assistantText = '我会把空间调得更柔和：保留木感、提高暖光比例，并推荐更轻盈的软装。'
      setSceneItems((current) =>
        current.map((item) =>
          item.category === '灯具'
            ? { ...item, tone: '#ffe7a8', accent: '#97f169' }
            : item
        )
      )
      setRecommendations((current) => [
        RECOMMENDATION_POOL.find((item) => item.category === '窗帘') ?? current[0],
        RECOMMENDATION_POOL.find((item) => item.category === '地毯') ?? current[1],
        RECOMMENDATION_POOL.find((item) => item.category === '装饰画') ?? current[2]
      ])
    } else if (text.includes('靠墙') || text.includes('调整布局')) {
      assistantText = '我先帮你整理了动线，把主要家具都贴近墙体，房间中间会更开阔。'
      setSceneItems((current) =>
        current.map((item) => {
          if (item.category === '床') {
            return { ...item, placementId: 'bed-center' }
          }
          if (item.category === '书桌') {
            return { ...item, placementId: 'left-wall-high' }
          }
          return item
        })
      )
    } else if (text.includes('窗帘')) {
      assistantText = '我把窗边材质调浅了一些，让光感更柔软了。'
    } else {
      assistantText = '我理解成“先保留功能布局，再增加一点温柔层次”。如果你愿意，我下一步可以继续替你加软装。'
    }

    const assistantMessage: ChatMessage = {
      id: nextId('chat'),
      role: 'assistant',
      text: assistantText
    }

    setChatMessages((current) => [...current, assistantMessage])
    setChatInput('')
  }

  return (
    <div className="app-shell">
      <div className="device-frame">
        <header className="top-bar">
          <div>
            <p className="eyebrow">CatCat AI Home Demo</p>
            <h1>快捷添加家具页</h1>
          </div>
          <div className="score-panel">
            <span>房间完整度</span>
            <strong>{roomScore}%</strong>
          </div>
        </header>

        <main className="screen-stage">
          <section className="scene-panel">
            <div className="scene-background" />
            <div className="scene-hud">
              <div className="status-chip">4×4 卧室</div>
              <div className="status-chip alt">3D 场景实时预览</div>
            </div>

            <div className="room-3d">
              <div className="wall wall-back" />
              <div className="wall wall-left" />
              <div className="wall wall-right" />
              <div className="window-panel">
                <span className="window-glow" />
              </div>
              <div className="floor-grid" />

              {sceneItems.map((item) => {
                const placement = PLACEMENTS.find((entry) => entry.id === item.placementId)
                if (!placement) {
                  return null
                }

                const style = {
                  '--left': placement.left,
                  '--top': placement.top,
                  '--width': placement.width,
                  '--depth': placement.depth,
                  '--rotate': placement.rotate,
                  '--tone': item.tone,
                  '--accent': item.accent
                } as React.CSSProperties

                return (
                  <div className={`furniture-block size-${item.size}`} style={style} key={item.id}>
                    <div className="furniture-top" />
                    <div className="furniture-label">
                      <strong>{item.name}</strong>
                      <span>{item.style}</span>
                    </div>
                  </div>
                )
              })}

              {activePackage && (
                <div className={`package-box ${activePackage.status === 'ready' ? 'ready' : ''}`}>
                  <div className="package-lid" />
                  <div className="package-body">
                    <strong>{activePackage.status === 'ready' ? '可签收' : '生成中'}</strong>
                    <span>{activePackage.name}</span>
                    <small>{activePackage.status === 'ready' ? '点击第二行气泡签收' : 'AI 正在生成 3D 模型'}</small>
                  </div>
                </div>
              )}
            </div>

            <div className="hero-copy">
              <div className="hero-badge">AI 陪伴装修模式</div>
              <h2>{sceneMode === 'home' ? '一边看房间，一边快速加家具' : '当前是快捷添加家具态'}</h2>
              <p>{heroTip}</p>
            </div>

            <button className={`cat-bubble ${sceneMode === 'quick' ? 'compact' : ''}`} onClick={handleOpenQuickAdd}>
              <span className="cat-avatar">猫</span>
              <span className="cat-text">{sceneMode === 'home' ? '点我开始布置' : '我在帮你盯着推荐'}</span>
            </button>
          </section>

          <aside className={`control-panel ${sceneMode === 'quick' ? 'visible' : ''}`}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Quick Add</p>
                <h3>快捷添加家具</h3>
              </div>
              <button className="ghost-button" onClick={() => setSceneMode(sceneMode === 'home' ? 'quick' : 'home')}>
                {sceneMode === 'home' ? '展开' : '收起'}
              </button>
            </div>

            <div className="bubble-row">
              <button className="bubble action" onClick={handlePhotoCapture}>
                <span className="bubble-icon">＋</span>
                <span>
                  <strong>拍照添加</strong>
                  <small>生成现实物品 3D 模型</small>
                </span>
              </button>

              {recommendations.map((item) => (
                <button className="bubble recommendation" key={item.id} onClick={() => takeRecommendation(item)}>
                  <span className="bubble-tag">{item.category}</span>
                  <strong>{item.name}</strong>
                  <small>{item.reason}</small>
                </button>
              ))}
            </div>

            <div className="claimed-header">
              <div>
                <p className="eyebrow">你的拍照家具</p>
                <h4>第二行最多保留 4 个待处理泡泡</h4>
              </div>
              <span className="slot-count">{photoItems.length}/4</span>
            </div>

            <div className="bubble-row second-row">
              {photoItems.length === 0 && <div className="empty-slot">拍个身边物品，第二行会在这里排队</div>}

              {photoItems.map((item) => (
                <div className={`bubble photo ${item.status}`} key={item.id}>
                  <span className="bubble-tag">{item.status === 'generating' ? '生成中' : item.status === 'ready' ? '可签收' : '待摆放'}</span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.status === 'generating'
                      ? '快递箱建模中，大约 10 秒'
                      : item.status === 'ready'
                        ? '先签收，再决定是否摆进房间'
                        : '点击摆放，或收入背包'}
                  </small>
                  <div className="photo-actions">
                    {item.status === 'ready' && (
                      <button className="mini-button" onClick={() => claimPhoto(item.id)}>
                        签收
                      </button>
                    )}
                    {item.status === 'claimed' && (
                      <>
                        <button className="mini-button" onClick={() => placePhoto(item)}>
                          自动摆放
                        </button>
                        <button className="mini-button ghost" onClick={() => stashPhoto(item.id)}>
                          收入背包
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button className="voice-trigger" onClick={() => setVoiceOpen(true)}>
              <span className="voice-pulse" />
              <div>
                <strong>召唤语音设计助手</strong>
                <small>替换家具 / 增加家具 / 调整位置 / 调整材质 / 调整布局</small>
              </div>
            </button>
          </aside>
        </main>
      </div>

      {captureOpen && (
        <div className="modal-scrim">
          <div className="capture-card">
            <div className="camera-preview">
              <div className="capture-target">
                <span>对准身边物品</span>
              </div>
            </div>
            <div className="capture-actions">
              <div>
                <p className="eyebrow">拍照添加</p>
                <h3>拍下任意物品，回到房间后生成快递箱</h3>
              </div>
              <div className="button-group">
                <button className="ghost-button" onClick={() => setCaptureOpen(false)}>
                  取消
                </button>
                <button className="primary-button" onClick={confirmPhotoCapture}>
                  模拟拍照完成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {voiceOpen && (
        <div className="voice-sheet-wrap">
          <div className="voice-sheet">
            <div className="voice-header">
              <div>
                <p className="eyebrow">AI 语音设计助手</p>
                <h3>保持房间可见，在场景里直接改</h3>
              </div>
              <button className="ghost-button" onClick={() => setVoiceOpen(false)}>
                关闭
              </button>
            </div>

            <div className="chip-row">
              {QUICK_CHIPS.map((chip) => (
                <button className="chip" key={chip} onClick={() => applyAssistantIntent(chip)}>
                  {chip}
                </button>
              ))}
            </div>

            <div className="chat-stream">
              {chatMessages.map((message) => (
                <div className={`chat-bubble ${message.role}`} key={message.id}>
                  {message.text}
                </div>
              ))}
            </div>

            <div className="chat-composer">
              <button className="mic-button" onClick={() => applyAssistantIntent('让房间更温馨')}>
                <span className="mic-wave" />
                语音
              </button>
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="例如：加一个书桌，把床靠墙，换成奶油风"
              />
              <button className="primary-button" onClick={() => applyAssistantIntent(chatInput)}>
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
