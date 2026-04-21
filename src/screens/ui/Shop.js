// Tienda con 3 pestanas: componentes, dados, cofres.
// Gestiona la compra + el modo "placement" para colocar el componente
// recien comprado sobre un nodo del tablero.

import { CONFIG, NODE_SOURCE, NODE_OUTPUT } from '../../config/constants.js';
import { DIE_TYPES } from '../../config/dieTypes.js';
import { dist, randInt } from '../../lib/math.js';
import { Modal } from './Modal.js';

export class Shop {
  constructor(componentManager) {
    this.componentManager = componentManager;
    this.overlay = document.getElementById('shop-overlay');
    this.itemsContainer = document.getElementById('shop-items');
    this.btnSkip = document.getElementById('btn-skip-shop');
    this.currentItems = [];
    this.onClose = null;
    this.playerState = null;
    this.pendingComponent = null;
    this.board = null;
    this.renderer = null;
    this.audio = null;
    this.juice = null;
    this.diceManager = null;
    this.activeTab = 'components';
    this._canvasClickHandler = null;
    this._canvasMoveHandler = null;
    this._canvasRightClickHandler = null;
  }

  open(playerState, board, renderer, audio, juice, diceManager, onClose) {
    this.playerState = playerState;
    this.board = board;
    this.renderer = renderer;
    this.audio = audio;
    this.juice = juice;
    this.diceManager = diceManager;
    this.onClose = onClose;
    this.pendingComponent = null;
    this.activeTab = 'components';
    this.currentItems = this.componentManager.getRandomShopItems(3, playerState.money);

    this.render();
    Modal.open('shop-overlay', this.audio);

    this.btnSkip.onclick = () => {
      this.cancelPlacement();
      this.close();
    };
  }

  render() {
    const panel = document.getElementById('shop-panel');
    let tabBar = panel.querySelector('.shop-tabs');
    if (!tabBar) {
      tabBar = document.createElement('div');
      tabBar.className = 'shop-tabs';
      panel.insertBefore(tabBar, this.itemsContainer);
    }

    let moneyBar = panel.querySelector('.shop-money');
    if (!moneyBar) {
      moneyBar = document.createElement('div');
      moneyBar.className = 'shop-money';
      panel.insertBefore(moneyBar, tabBar);
    }
    moneyBar.innerHTML = `<span class="shop-money-icon">◆</span> $${this.playerState.money}`;

    tabBar.innerHTML = `
            <button class="shop-tab ${this.activeTab === 'components' ? 'active' : ''}" data-tab="components">CIRCUITOS</button>
            <button class="shop-tab ${this.activeTab === 'dice' ? 'active' : ''}" data-tab="dice">DADOS</button>
            <button class="shop-tab ${this.activeTab === 'chest' ? 'active' : ''}" data-tab="chest">COFRE</button>
        `;

    tabBar.querySelectorAll('.shop-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });

    switch (this.activeTab) {
      case 'components': this.renderComponents(); break;
      case 'dice': this.renderDice(); break;
      case 'chest': this.renderChest(); break;
    }
  }

  // --- Pestana componentes ---
  renderComponents() {
    this.itemsContainer.innerHTML = '';

    this.currentItems.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'shop-item';
      const canBuy = this.playerState.money >= item.price;
      if (!canBuy) el.classList.add('too-expensive');
      el.innerHTML = `
                <div class="item-symbol">${item.symbol}</div>
                <div class="item-name" style="color:${item.color}">${item.name}</div>
                <div class="item-desc">${item.desc}</div>
                <div class="item-price">$${item.price}</div>
            `;

      el.addEventListener('click', () => {
        if (el.classList.contains('bought') || !canBuy) return;
        this.pendingComponent = { def: item, el: el };
        this.enterPlacementMode();
      });

      this.itemsContainer.appendChild(el);
    });
  }

  // --- Pestana dados ---
  renderDice() {
    this.itemsContainer.innerHTML = '';

    const invDiv = document.createElement('div');
    invDiv.className = 'dice-inventory';
    invDiv.innerHTML = '<div class="inv-title">TU BOLSA</div>';
    const bagDiv = document.createElement('div');
    bagDiv.className = 'inv-dice-list';
    this.diceManager.inventory.forEach((inv, idx) => {
      const def = DIE_TYPES[inv.type];
      const chip = document.createElement('span');
      chip.className = 'inv-die-chip';
      chip.style.borderColor = def.color;
      chip.style.color = def.color;
      chip.textContent = def.name;
      bagDiv.appendChild(chip);
    });
    invDiv.appendChild(bagDiv);
    this.itemsContainer.appendChild(invDiv);

    const shopGrid = document.createElement('div');
    shopGrid.className = 'shop-dice-grid';

    // Comprar dados nuevos
    const buyOptions = [
      { type: 'd4',  label: 'COMPRAR D4',  desc: 'Dado de 4 caras. Barato y versatil.' },
      { type: 'd6',  label: 'COMPRAR D6',  desc: 'Dado clasico de 6 caras.' },
      { type: 'd8',  label: 'COMPRAR D8',  desc: 'Dado de 8 caras. Mas potencial.' },
      { type: 'd10', label: 'COMPRAR D10', desc: 'Dado de 10. Numeros altos.' },
      { type: 'd12', label: 'COMPRAR D12', desc: 'Dado de 12. Potencia maxima.' },
    ];

    for (const opt of buyOptions) {
      const def = DIE_TYPES[opt.type];
      const canBuy = this.playerState.money >= def.price;
      const el = document.createElement('div');
      el.className = 'shop-item' + (canBuy ? '' : ' too-expensive');
      el.innerHTML = `
                <div class="item-symbol" style="color:${def.color}">${def.symbol}</div>
                <div class="item-name" style="color:${def.color}">${opt.label}</div>
                <div class="item-desc">${opt.desc}</div>
                <div class="item-desc">1-${def.faces} caras</div>
                <div class="item-price">$${def.price}</div>
            `;

      if (canBuy) {
        el.addEventListener('click', () => {
          this.playerState.money -= def.price;
          this.diceManager.addDie(opt.type);
          if (this.audio) this.audio.playShopBuy();
          this.updateMoney();
          this.render();
        });
      }

      shopGrid.appendChild(el);
    }

    // Opcion de mejorar un dado existente
    if (this.diceManager.inventory.length > 0) {
      const upgradeCost = 8;
      const canUpgrade = this.playerState.money >= upgradeCost;
      const upEl = document.createElement('div');
      upEl.className = 'shop-item upgrade-item' + (canUpgrade ? '' : ' too-expensive');
      upEl.innerHTML = `
                <div class="item-symbol">⬆</div>
                <div class="item-name" style="color:#ffd700">MEJORAR DADO</div>
                <div class="item-desc">Sube un dado al siguiente tipo (D4>D6>D8...)</div>
                <div class="item-price">$${upgradeCost}</div>
            `;

      if (canUpgrade) {
        upEl.addEventListener('click', () => {
          const order = ['d4', 'd6', 'd8', 'd10', 'd12'];
          let bestIdx = -1;
          let bestRank = 999;
          this.diceManager.inventory.forEach((inv, i) => {
            const rank = order.indexOf(inv.type);
            if (rank < order.length - 1 && rank < bestRank) {
              bestRank = rank;
              bestIdx = i;
            }
          });
          if (bestIdx >= 0) {
            this.playerState.money -= upgradeCost;
            this.diceManager.upgradeDie(bestIdx);
            if (this.audio) this.audio.playShopBuy();
            this.updateMoney();
            this.render();
          }
        });
      }
      shopGrid.appendChild(upEl);
    }

    this.itemsContainer.appendChild(shopGrid);
  }

  // --- Pestana cofres ---
  renderChest() {
    this.itemsContainer.innerHTML = '';

    const chests = [
      {
        id: 'basic',
        name: 'COFRE BASICO',
        desc: '1 recompensa aleatoria',
        price: 5,
        symbol: '[?]',
        rewards: 1,
      },
      {
        id: 'premium',
        name: 'COFRE RARO',
        desc: '3 recompensas aleatorias',
        price: 12,
        symbol: '[??]',
        rewards: 3,
      },
      {
        id: 'mega',
        name: 'COFRE MEGA',
        desc: '5 recompensas. Minimo 1 rara.',
        price: 20,
        symbol: '[???]',
        rewards: 5,
        guaranteeRare: true,
      },
    ];

    for (const chest of chests) {
      const canBuy = this.playerState.money >= chest.price;
      const el = document.createElement('div');
      el.className = 'shop-item chest-item' + (canBuy ? '' : ' too-expensive');
      el.innerHTML = `
                <div class="item-symbol">${chest.symbol}</div>
                <div class="item-name" style="color:#ffd700">${chest.name}</div>
                <div class="item-desc">${chest.desc}</div>
                <div class="item-price">$${chest.price}</div>
            `;

      if (canBuy) {
        el.addEventListener('click', () => {
          this.playerState.money -= chest.price;
          if (this.audio) this.audio.playShopBuy();
          this.updateMoney();
          this.openChest(chest);
        });
      }

      this.itemsContainer.appendChild(el);
    }
  }

  openChest(chest) {
    const rewards = this.generateRewards(chest.rewards, chest.guaranteeRare);

    this.itemsContainer.innerHTML = '';

    const resultDiv = document.createElement('div');
    resultDiv.className = 'chest-results';

    const title = document.createElement('div');
    title.className = 'chest-title';
    title.textContent = chest.name;
    resultDiv.appendChild(title);

    const rewardsDiv = document.createElement('div');
    rewardsDiv.className = 'chest-rewards';

    rewards.forEach((reward, i) => {
      const card = document.createElement('div');
      card.className = 'reward-card hidden';
      card.innerHTML = `
                <div class="reward-symbol" style="color:${reward.color}">${reward.symbol}</div>
                <div class="reward-name" style="color:${reward.color}">${reward.name}</div>
                <div class="reward-desc">${reward.desc}</div>
            `;

      setTimeout(() => {
        card.classList.remove('hidden');
        card.classList.add('revealed');
        if (this.audio) this.audio.playPlace();
        if (this.juice) {
          this.juice.flash(reward.color, 100);
        }
      }, 300 + i * 400);

      rewardsDiv.appendChild(card);

      this.applyReward(reward);
    });

    resultDiv.appendChild(rewardsDiv);

    const backBtn = document.createElement('button');
    backBtn.className = 'action-btn';
    backBtn.textContent = 'VOLVER';
    backBtn.style.marginTop = '16px';
    backBtn.addEventListener('click', () => this.render());
    resultDiv.appendChild(backBtn);

    this.itemsContainer.appendChild(resultDiv);
  }

  generateRewards(count, guaranteeRare = false) {
    const rewards = [];
    const pool = [
      { weight: 8, gen: () => this.rewardDie('d4') },
      { weight: 6, gen: () => this.rewardDie('d6') },
      { weight: 4, gen: () => this.rewardDie('d8') },
      { weight: 2, gen: () => this.rewardDie('d10') },
      { weight: 1, gen: () => this.rewardDie('d12') },
      {
        weight: 5,
        gen: () => ({
          type: 'money',
          amount: randInt(3, 8),
          name: `+$`,
          desc: 'Dinero extra',
          symbol: '$$',
          color: '#ffd700',
        }),
      },
      {
        weight: 2,
        gen: () => ({
          type: 'life',
          name: '+1 VIDA',
          desc: 'Una oportunidad mas',
          symbol: '<3',
          color: '#ff3a3a',
        }),
      },
      {
        weight: 3,
        gen: () => ({
          type: 'upgrade',
          name: 'UPGRADE',
          desc: 'Mejora tu peor dado',
          symbol: '^^',
          color: '#39ff14',
        }),
      },
    ];

    const totalWeight = pool.reduce((s, p) => s + p.weight, 0);

    for (let i = 0; i < count; i++) {
      let roll = Math.random() * totalWeight;
      for (const entry of pool) {
        roll -= entry.weight;
        if (roll <= 0) {
          const reward = entry.gen();
          if (reward.type === 'money') {
            reward.amount = randInt(3, 8);
            reward.name = `+$${reward.amount}`;
          }
          rewards.push(reward);
          break;
        }
      }
    }

    // Garantizar al menos 1 rara si es mega
    if (
      guaranteeRare &&
      !rewards.some((r) => r.type === 'die' && ['d10', 'd12'].includes(r.dieType))
    ) {
      const rareReward = Math.random() < 0.5 ? this.rewardDie('d10') : this.rewardDie('d12');
      rewards[0] = rareReward;
    }

    return rewards;
  }

  rewardDie(type) {
    const def = DIE_TYPES[type];
    return {
      type: 'die',
      dieType: type,
      name: `DADO ${def.name}`,
      desc: `1-${def.faces} caras`,
      symbol: def.symbol,
      color: def.color,
    };
  }

  applyReward(reward) {
    switch (reward.type) {
      case 'die':
        this.diceManager.addDie(reward.dieType);
        break;
      case 'money':
        this.playerState.money += reward.amount;
        this.updateMoney();
        break;
      case 'life':
        this.playerState.lives = Math.min(this.playerState.lives + 1, 5);
        document.getElementById('lives-display').textContent = '♥'.repeat(
          this.playerState.lives,
        );
        break;
      case 'upgrade': {
        const order = ['d4', 'd6', 'd8', 'd10', 'd12'];
        let bestIdx = -1;
        let bestRank = 999;
        this.diceManager.inventory.forEach((inv, i) => {
          const rank = order.indexOf(inv.type);
          if (rank < order.length - 1 && rank < bestRank) {
            bestRank = rank;
            bestIdx = i;
          }
        });
        if (bestIdx >= 0) this.diceManager.upgradeDie(bestIdx);
        break;
      }
    }
  }

  // --- Placement mode (para colocar componente recien comprado) ---

  enterPlacementMode() {
    Modal.close('shop-overlay', this.audio);
    this.showPlacementHint(this.pendingComponent.def.name);
    this.highlightFreeNodes(true);
    this.renderer.drawBoard(this.board);

    const canvas = this.renderer.canvas;

    this._canvasMoveHandler = (e) => {
      const pos = this.getCanvasPos(e, canvas);
      this.board.nodes.forEach((n) => {
        n.hover =
          this.isPlaceableNode(n) &&
          dist(pos.x, pos.y, n.x, n.y) <= CONFIG.BOARD.NODE_RADIUS * 1.3;
      });
      this.renderer.drawBoard(this.board);
    };

    this._canvasClickHandler = (e) => {
      const pos = this.getCanvasPos(e, canvas);
      const node = this.board.getNodeAtPosition(pos.x, pos.y);

      if (node && this.isPlaceableNode(node)) {
        const comp = this.pendingComponent.def;
        this.playerState.money -= comp.price;
        node.component = this.componentManager.createInstance(comp.id);
        this.pendingComponent.el.classList.add('bought');
        this.updateMoney();

        if (this.audio) this.audio.playShopBuy();
        if (this.juice) this.juice.spawnNodeBurst(node.x, node.y, comp.color, 10);

        this.exitPlacementMode();
        Modal.open('shop-overlay', this.audio);
      }
    };

    this._canvasRightClickHandler = (e) => {
      e.preventDefault();
      this.cancelPlacement();
      Modal.open('shop-overlay', this.audio);
    };

    canvas.addEventListener('mousemove', this._canvasMoveHandler);
    canvas.addEventListener('click', this._canvasClickHandler);
    canvas.addEventListener('contextmenu', this._canvasRightClickHandler);
  }

  exitPlacementMode() {
    const canvas = this.renderer.canvas;
    if (this._canvasClickHandler) {
      canvas.removeEventListener('click', this._canvasClickHandler);
      this._canvasClickHandler = null;
    }
    if (this._canvasMoveHandler) {
      canvas.removeEventListener('mousemove', this._canvasMoveHandler);
      this._canvasMoveHandler = null;
    }
    if (this._canvasRightClickHandler) {
      canvas.removeEventListener('contextmenu', this._canvasRightClickHandler);
      this._canvasRightClickHandler = null;
    }

    this.highlightFreeNodes(false);
    this.board.nodes.forEach((n) => (n.hover = false));
    this.hidePlacementHint();
    this.pendingComponent = null;
    this.renderer.drawBoard(this.board);
  }

  cancelPlacement() {
    if (this.pendingComponent) {
      this.exitPlacementMode();
    }
  }

  // --- Utilidades ---

  isPlaceableNode(node) {
    return node.type !== NODE_SOURCE && node.type !== NODE_OUTPUT && !node.component;
  }

  highlightFreeNodes(on) {
    this.board.nodes.forEach((n) => {
      n._placeable = on && this.isPlaceableNode(n);
    });
  }

  getCanvasPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  showPlacementHint(name) {
    let hint = document.getElementById('placement-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'placement-hint';
      document.getElementById('game-container').appendChild(hint);
    }
    hint.textContent = `CLICK NODO PARA ${name.toUpperCase()} - DERECHO PARA CANCELAR`;
    hint.classList.remove('hidden');
  }

  hidePlacementHint() {
    const hint = document.getElementById('placement-hint');
    if (hint) hint.classList.add('hidden');
  }

  updateMoney() {
    document.getElementById('money-display').textContent = `$${this.playerState.money}`;
    const shopMoney = document.querySelector('.shop-money');
    if (shopMoney) {
      shopMoney.innerHTML = `<span class="shop-money-icon">◆</span> $${this.playerState.money}`;
    }
  }

  close() {
    Modal.close('shop-overlay', this.audio, () => {
      if (this.onClose) this.onClose();
    });
  }
}
