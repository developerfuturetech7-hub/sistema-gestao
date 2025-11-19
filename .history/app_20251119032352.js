// Sistema de Gestão Financeira e Orçamentos
// Armazenamento de dados no LocalStorage

class SistemaGestao {
    constructor() {
        this.dados = {
            configuracoes: {},
            clientes: [],
            produtos: [],
            lancamentos: [],
            orcamentos: [],
            saldoInicial: 0
        };
        this.editandoId = null;
        this.orcamentoAtual = {
            itens: []
        };
        this.init();
    }

    init() {
        this.carregarDados();
        this.configurarEventos();
        this.atualizarInterface();
        this.mostrarPagina('dashboard');
    }

    // ==================== GERENCIAMENTO DE DADOS ====================
    carregarDados() {
        const dadosSalvos = localStorage.getItem('sistemaGestao');
        if (dadosSalvos) {
            this.dados = JSON.parse(dadosSalvos);
        }
        
        // Carregar saldo inicial
        if (this.dados.saldoInicial) {
            document.getElementById('saldoInicial').value = this.dados.saldoInicial;
        }
        
        // Carregar configurações
        if (this.dados.configuracoes) {
            const config = this.dados.configuracoes;
            if (config.nome) {
                document.getElementById('empresaNome').textContent = config.nome;
                document.getElementById('configNome').value = config.nome;
            }
            if (config.cnpj) {
                document.getElementById('empresaCnpj').textContent = config.cnpj;
                document.getElementById('configCnpj').value = config.cnpj;
            }
            if (config.telefone) document.getElementById('configTelefone').value = config.telefone;
            if (config.email) document.getElementById('configEmail').value = config.email;
            if (config.endereco) document.getElementById('configEndereco').value = config.endereco;
            if (config.logo) {
                document.getElementById('logoPreview').src = config.logo;
                document.getElementById('logoPreview').style.display = 'block';
                document.getElementById('configLogoPreview').src = config.logo;
                document.getElementById('configLogoPreview').style.display = 'block';
            }
        }
    }

    salvarDados() {
        localStorage.setItem('sistemaGestao', JSON.stringify(this.dados));
    }

    // ==================== NAVEGAÇÃO ====================
    mostrarPagina(nomePagina) {
        // Esconder todas as páginas
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Remover active de todos os menus
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Mostrar página selecionada
        document.getElementById(`${nomePagina}-page`).classList.add('active');
        document.querySelector(`[data-page="${nomePagina}"]`).classList.add('active');
        
        // Atualizar conteúdo da página
        switch(nomePagina) {
            case 'dashboard':
                this.atualizarDashboard();
                break;
            case 'financeiro':
                this.listarLancamentos();
                break;
            case 'orcamentos':
                this.listarOrcamentos();
                break;
            case 'clientes':
                this.listarClientes();
                break;
            case 'produtos':
                this.listarProdutos();
                break;
        }
    }

    // ==================== CONFIGURAÇÃO DE EVENTOS ====================
    configurarEventos() {
        // Navegação
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const pagina = e.currentTarget.dataset.page;
                this.mostrarPagina(pagina);
            });
        });

        // Saldo inicial
        document.getElementById('saldoInicial').addEventListener('change', (e) => {
            this.dados.saldoInicial = parseFloat(e.target.value) || 0;
            this.salvarDados();
            this.atualizarDashboard();
        });

        // Configurações
        document.getElementById('btnSalvarConfig').addEventListener('click', () => this.salvarConfiguracoes());
        document.getElementById('configLogo').addEventListener('change', (e) => this.carregarLogo(e));
        document.getElementById('btnExportarDados').addEventListener('click', () => this.exportarDados());
        document.getElementById('btnCompartilharDados').addEventListener('click', () => this.compartilharDados());
        document.getElementById('btnExportarFinanceiro').addEventListener('click', () => this.exportarFinanceiroCSV());
        document.getElementById('btnImportarDados').addEventListener('click', () => {
            document.getElementById('inputImportarDados').click();
        });
        document.getElementById('inputImportarDados').addEventListener('change', (e) => this.importarDados(e));
        document.getElementById('btnImportarExcel').addEventListener('click', () => {
            document.getElementById('inputImportarExcel').click();
        });
        document.getElementById('inputImportarExcel').addEventListener('change', (e) => this.importarExcel(e));
        document.getElementById('btnCarregarPlanilha').addEventListener('click', () => this.carregarPlanilhaExistente());

        // Lançamentos
        document.getElementById('btnNovoLancamento').addEventListener('click', () => this.abrirModalLancamento());
        document.getElementById('btnSalvarLancamento').addEventListener('click', () => this.salvarLancamento());
        document.getElementById('btnCancelarLancamento').addEventListener('click', () => this.fecharModal('modalLancamento'));

        // Clientes
        document.getElementById('btnNovoCliente').addEventListener('click', () => this.abrirModalCliente());
        document.getElementById('btnSalvarCliente').addEventListener('click', () => this.salvarCliente());
        document.getElementById('btnCancelarCliente').addEventListener('click', () => this.fecharModal('modalCliente'));

        // Produtos
        document.getElementById('btnNovoProduto').addEventListener('click', () => this.abrirModalProduto());
        document.getElementById('btnSalvarProduto').addEventListener('click', () => this.salvarProduto());
        document.getElementById('btnCancelarProduto').addEventListener('click', () => this.fecharModal('modalProduto'));

        // Orçamentos
        document.getElementById('btnNovoOrcamento').addEventListener('click', () => this.abrirModalOrcamento());
        document.getElementById('btnSalvarOrcamento').addEventListener('click', () => this.salvarOrcamento());
        document.getElementById('btnCancelarOrcamento').addEventListener('click', () => this.fecharModal('modalOrcamento'));
        document.getElementById('btnAdicionarItem').addEventListener('click', () => this.adicionarItemOrcamento());
        document.getElementById('btnImprimirOrcamento').addEventListener('click', () => window.print());
        document.getElementById('btnAprovarOrcamento').addEventListener('click', () => this.aprovarOrcamento());
        document.getElementById('btnExcluirOrcamento').addEventListener('click', () => this.excluirOrcamento());
        document.getElementById('btnFecharVisualizacao').addEventListener('click', () => this.fecharModal('modalVisualizarOrcamento'));

        // Fechar modais ao clicar no X
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.fecharModal(modal.id);
            });
        });

        // Fechar modal ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.fecharModal(e.target.id);
            }
        });
    }

    // ==================== MODAIS ====================
    abrirModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    fecharModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
        this.editandoId = null;
    }

    // ==================== DASHBOARD ====================
    atualizarDashboard() {
        const calculos = this.calcularSaldos();
        
        document.getElementById('saldoAtual').textContent = this.formatarMoeda(calculos.saldoAtual);
        document.getElementById('saidasConta').textContent = this.formatarMoeda(calculos.saidasConta);
        document.getElementById('saldoDevedor').textContent = this.formatarMoeda(calculos.saldoDevedor);
        document.getElementById('saldoReceber').textContent = this.formatarMoeda(calculos.saldoReceber);
        document.getElementById('saldoAtrasado').textContent = this.formatarMoeda(calculos.saldoAtrasado);
        document.getElementById('totalOrcamentos').textContent = this.dados.orcamentos.length;

        this.atualizarUltimosLancamentos();
        this.atualizarOrcamentosPendentes();
    }

    calcularSaldos() {
        const saldoInicial = this.dados.saldoInicial || 0;
        let saldoAtual = saldoInicial;
        let saidasConta = 0;
        let saldoDevedor = 0;
        let saldoReceber = 0;
        let saldoAtrasado = 0;
        const hoje = new Date().toISOString().split('T')[0];

        this.dados.lancamentos.forEach(lanc => {
            const valor = parseFloat(lanc.valor) || 0;
            
            if (lanc.status === 'Confirmado') {
                // Confirmados afetam o saldo atual
                if (lanc.categoria === 'Devo' || lanc.categoria === 'Débito' || lanc.categoria === 'Crédito') {
                    saldoAtual -= valor;
                    saidasConta += valor;
                } else if (lanc.categoria === 'A receber' || lanc.categoria === 'Pix') {
                    saldoAtual += valor;
                }
            } else {
                // Pendentes
                if (lanc.categoria === 'Devo') {
                    saldoDevedor += valor;
                    if (lanc.vencimento && lanc.vencimento < hoje) {
                        saldoAtrasado += valor;
                    }
                } else if (lanc.categoria === 'A receber') {
                    saldoReceber += valor;
                    if (lanc.vencimento && lanc.vencimento < hoje) {
                        saldoAtrasado += valor;
                    }
                }
            }
        });

        return {
            saldoAtual,
            saidasConta,
            saldoDevedor,
            saldoReceber,
            saldoAtrasado
        };
    }

    atualizarUltimosLancamentos() {
        const container = document.getElementById('ultimosLancamentos');
        const ultimos = this.dados.lancamentos.slice(-5).reverse();
        
        if (ultimos.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhum lançamento ainda</p>';
            return;
        }

        container.innerHTML = ultimos.map(lanc => `
            <div class="lancamento-item">
                <div>
                    <strong>${lanc.descricao}</strong><br>
                    <small>${lanc.categoria} - ${this.formatarData(lanc.data)}</small>
                </div>
                <div style="text-align: right;">
                    <strong>${this.formatarMoeda(lanc.valor)}</strong><br>
                    <span class="status-badge status-${lanc.status.toLowerCase()}">${lanc.status}</span>
                </div>
            </div>
        `).join('');
    }

    atualizarOrcamentosPendentes() {
        const container = document.getElementById('orcamentosPendentes');
        const pendentes = this.dados.orcamentos.filter(orc => orc.status === 'Pendente');
        
        if (pendentes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhum orçamento pendente</p>';
            return;
        }

        container.innerHTML = pendentes.map(orc => `
            <div class="orcamento-item">
                <div>
                    <strong>Orçamento #${orc.numero}</strong><br>
                    <small>${orc.clienteNome} - ${this.formatarData(orc.data)}</small>
                </div>
                <div style="text-align: right;">
                    <strong>${this.formatarMoeda(orc.total)}</strong>
                </div>
            </div>
        `).join('');
    }

    // ==================== LANÇAMENTOS FINANCEIROS ====================
    abrirModalLancamento(id = null) {
        this.editandoId = id;
        
        if (id) {
            const lanc = this.dados.lancamentos.find(l => l.id === id);
            if (lanc) {
                document.getElementById('lancamentoData').value = lanc.data;
                document.getElementById('lancamentoDescricao').value = lanc.descricao;
                document.getElementById('lancamentoCategoria').value = lanc.categoria;
                document.getElementById('lancamentoValor').value = lanc.valor;
                document.getElementById('lancamentoVencimento').value = lanc.vencimento;
                document.getElementById('lancamentoStatus').value = lanc.status;
            }
        } else {
            document.getElementById('lancamentoData').value = new Date().toISOString().split('T')[0];
            document.getElementById('lancamentoDescricao').value = '';
            document.getElementById('lancamentoCategoria').value = 'Devo';
            document.getElementById('lancamentoValor').value = '';
            document.getElementById('lancamentoVencimento').value = '';
            document.getElementById('lancamentoStatus').value = 'Pendente';
        }
        
        this.abrirModal('modalLancamento');
    }

    salvarLancamento() {
        const lancamento = {
            id: this.editandoId || Date.now(),
            data: document.getElementById('lancamentoData').value,
            descricao: document.getElementById('lancamentoDescricao').value,
            categoria: document.getElementById('lancamentoCategoria').value,
            valor: parseFloat(document.getElementById('lancamentoValor').value) || 0,
            vencimento: document.getElementById('lancamentoVencimento').value,
            status: document.getElementById('lancamentoStatus').value
        };

        if (!lancamento.descricao || !lancamento.valor) {
            alert('Preencha a descrição e o valor!');
            return;
        }

        if (this.editandoId) {
            const index = this.dados.lancamentos.findIndex(l => l.id === this.editandoId);
            this.dados.lancamentos[index] = lancamento;
        } else {
            this.dados.lancamentos.push(lancamento);
        }

        this.salvarDados();
        this.listarLancamentos();
        this.atualizarDashboard();
        this.fecharModal('modalLancamento');
    }

    listarLancamentos() {
        const tbody = document.getElementById('listaLancamentos');
        
        if (this.dados.lancamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum lançamento cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = this.dados.lancamentos.map(lanc => `
            <tr>
                <td>${this.formatarData(lanc.data)}</td>
                <td>${lanc.descricao}</td>
                <td>${lanc.categoria}</td>
                <td>${this.formatarMoeda(lanc.valor)}</td>
                <td>${lanc.vencimento ? this.formatarData(lanc.vencimento) : '-'}</td>
                <td><span class="status-badge status-${lanc.status.toLowerCase()}">${lanc.status}</span></td>
                <td>
                    <button class="action-btn btn-primary" onclick="sistema.abrirModalLancamento(${lanc.id})">Editar</button>
                    <button class="action-btn btn-danger" onclick="sistema.excluirLancamento(${lanc.id})">Excluir</button>
                </td>
            </tr>
        `).join('');
    }

    excluirLancamento(id) {
        if (confirm('Deseja realmente excluir este lançamento?')) {
            this.dados.lancamentos = this.dados.lancamentos.filter(l => l.id !== id);
            this.salvarDados();
            this.listarLancamentos();
            this.atualizarDashboard();
        }
    }

    // ==================== CLIENTES ====================
    abrirModalCliente(id = null) {
        this.editandoId = id;
        
        if (id) {
            const cliente = this.dados.clientes.find(c => c.id === id);
            if (cliente) {
                document.getElementById('clienteNome').value = cliente.nome;
                document.getElementById('clienteDoc').value = cliente.documento;
                document.getElementById('clienteTelefone').value = cliente.telefone;
                document.getElementById('clienteEmail').value = cliente.email;
                document.getElementById('clienteEndereco').value = cliente.endereco;
            }
        } else {
            document.getElementById('clienteNome').value = '';
            document.getElementById('clienteDoc').value = '';
            document.getElementById('clienteTelefone').value = '';
            document.getElementById('clienteEmail').value = '';
            document.getElementById('clienteEndereco').value = '';
        }
        
        this.abrirModal('modalCliente');
    }

    salvarCliente() {
        const cliente = {
            id: this.editandoId || Date.now(),
            nome: document.getElementById('clienteNome').value,
            documento: document.getElementById('clienteDoc').value,
            telefone: document.getElementById('clienteTelefone').value,
            email: document.getElementById('clienteEmail').value,
            endereco: document.getElementById('clienteEndereco').value
        };

        if (!cliente.nome) {
            alert('Preencha o nome do cliente!');
            return;
        }

        if (this.editandoId) {
            const index = this.dados.clientes.findIndex(c => c.id === this.editandoId);
            this.dados.clientes[index] = cliente;
        } else {
            this.dados.clientes.push(cliente);
        }

        this.salvarDados();
        this.listarClientes();
        this.fecharModal('modalCliente');
        this.atualizarSelectClientes();
    }

    listarClientes() {
        const tbody = document.getElementById('listaClientes');
        
        if (this.dados.clientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum cliente cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = this.dados.clientes.map(cliente => `
            <tr>
                <td>${cliente.nome}</td>
                <td>${cliente.documento || '-'}</td>
                <td>${cliente.telefone || '-'}</td>
                <td>${cliente.email || '-'}</td>
                <td>
                    <button class="action-btn btn-primary" onclick="sistema.abrirModalCliente(${cliente.id})">Editar</button>
                    <button class="action-btn btn-danger" onclick="sistema.excluirCliente(${cliente.id})">Excluir</button>
                </td>
            </tr>
        `).join('');
    }

    excluirCliente(id) {
        if (confirm('Deseja realmente excluir este cliente?')) {
            this.dados.clientes = this.dados.clientes.filter(c => c.id !== id);
            this.salvarDados();
            this.listarClientes();
            this.atualizarSelectClientes();
        }
    }

    atualizarSelectClientes() {
        const select = document.getElementById('orcamentoCliente');
        select.innerHTML = '<option value="">Selecione um cliente</option>' +
            this.dados.clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    }

    // ==================== PRODUTOS ====================
    abrirModalProduto(id = null) {
        this.editandoId = id;
        
        if (id) {
            const produto = this.dados.produtos.find(p => p.id === id);
            if (produto) {
                document.getElementById('produtoCodigo').value = produto.codigo;
                document.getElementById('produtoDescricao').value = produto.descricao;
                document.getElementById('produtoCusto').value = produto.custo;
                document.getElementById('produtoVenda').value = produto.venda;
                document.getElementById('produtoUnidade').value = produto.unidade;
            }
        } else {
            document.getElementById('produtoCodigo').value = '';
            document.getElementById('produtoDescricao').value = '';
            document.getElementById('produtoCusto').value = '';
            document.getElementById('produtoVenda').value = '';
            document.getElementById('produtoUnidade').value = 'UN';
        }
        
        this.abrirModal('modalProduto');
    }

    salvarProduto() {
        const produto = {
            id: this.editandoId || Date.now(),
            codigo: document.getElementById('produtoCodigo').value,
            descricao: document.getElementById('produtoDescricao').value,
            custo: parseFloat(document.getElementById('produtoCusto').value) || 0,
            venda: parseFloat(document.getElementById('produtoVenda').value) || 0,
            unidade: document.getElementById('produtoUnidade').value
        };

        if (!produto.descricao || !produto.venda) {
            alert('Preencha a descrição e o preço de venda!');
            return;
        }

        if (this.editandoId) {
            const index = this.dados.produtos.findIndex(p => p.id === this.editandoId);
            this.dados.produtos[index] = produto;
        } else {
            this.dados.produtos.push(produto);
        }

        this.salvarDados();
        this.listarProdutos();
        this.fecharModal('modalProduto');
        this.atualizarSelectProdutos();
    }

    listarProdutos() {
        const tbody = document.getElementById('listaProdutos');
        
        if (this.dados.produtos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum produto cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = this.dados.produtos.map(produto => {
            const margem = produto.custo > 0 ? ((produto.venda - produto.custo) / produto.custo * 100).toFixed(2) : 0;
            return `
                <tr>
                    <td>${produto.codigo || '-'}</td>
                    <td>${produto.descricao}</td>
                    <td>${this.formatarMoeda(produto.custo)}</td>
                    <td>${this.formatarMoeda(produto.venda)}</td>
                    <td>${margem}%</td>
                    <td>
                        <button class="action-btn btn-primary" onclick="sistema.abrirModalProduto(${produto.id})">Editar</button>
                        <button class="action-btn btn-danger" onclick="sistema.excluirProduto(${produto.id})">Excluir</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    excluirProduto(id) {
        if (confirm('Deseja realmente excluir este produto?')) {
            this.dados.produtos = this.dados.produtos.filter(p => p.id !== id);
            this.salvarDados();
            this.listarProdutos();
            this.atualizarSelectProdutos();
        }
    }

    atualizarSelectProdutos() {
        const select = document.getElementById('itemProduto');
        select.innerHTML = '<option value="">Selecione um produto</option>' +
            this.dados.produtos.map(p => `<option value="${p.id}">${p.descricao} - ${this.formatarMoeda(p.venda)}</option>`).join('');
    }

    // ==================== ORÇAMENTOS ====================
    abrirModalOrcamento(id = null) {
        this.editandoId = id;
        this.orcamentoAtual = { itens: [] };
        
        this.atualizarSelectClientes();
        this.atualizarSelectProdutos();
        
        document.getElementById('orcamentoData').value = new Date().toISOString().split('T')[0];
        document.getElementById('orcamentoCliente').value = '';
        document.getElementById('orcamentoObs').value = '';
        document.getElementById('listaItensOrcamento').innerHTML = '';
        document.getElementById('orcamentoTotal').textContent = '0,00';
        
        this.abrirModal('modalOrcamento');
    }

    adicionarItemOrcamento() {
        const produtoId = parseInt(document.getElementById('itemProduto').value);
        const quantidade = parseFloat(document.getElementById('itemQuantidade').value) || 1;
        const preco = parseFloat(document.getElementById('itemPreco').value);

        if (!produtoId || !preco) {
            alert('Selecione um produto e informe o preço!');
            return;
        }

        const produto = this.dados.produtos.find(p => p.id === produtoId);
        
        const item = {
            id: Date.now(),
            produtoId: produtoId,
            produtoNome: produto.descricao,
            quantidade: quantidade,
            preco: preco,
            total: quantidade * preco
        };

        this.orcamentoAtual.itens.push(item);
        this.atualizarListaItensOrcamento();
        
        // Limpar campos
        document.getElementById('itemProduto').value = '';
        document.getElementById('itemQuantidade').value = '';
        document.getElementById('itemPreco').value = '';
    }

    atualizarListaItensOrcamento() {
        const tbody = document.getElementById('listaItensOrcamento');
        const total = this.orcamentoAtual.itens.reduce((sum, item) => sum + item.total, 0);
        
        tbody.innerHTML = this.orcamentoAtual.itens.map(item => `
            <tr>
                <td>${item.produtoNome}</td>
                <td>${item.quantidade}</td>
                <td>${this.formatarMoeda(item.preco)}</td>
                <td>${this.formatarMoeda(item.total)}</td>
                <td>
                    <button class="action-btn btn-danger" onclick="sistema.removerItemOrcamento(${item.id})">Remover</button>
                </td>
            </tr>
        `).join('');
        
        document.getElementById('orcamentoTotal').textContent = this.formatarMoeda(total);
    }

    removerItemOrcamento(itemId) {
        this.orcamentoAtual.itens = this.orcamentoAtual.itens.filter(i => i.id !== itemId);
        this.atualizarListaItensOrcamento();
    }

    salvarOrcamento() {
        const clienteId = parseInt(document.getElementById('orcamentoCliente').value);
        
        if (!clienteId) {
            alert('Selecione um cliente!');
            return;
        }
        
        if (this.orcamentoAtual.itens.length === 0) {
            alert('Adicione pelo menos um item ao orçamento!');
            return;
        }

        const cliente = this.dados.clientes.find(c => c.id === clienteId);
        const total = this.orcamentoAtual.itens.reduce((sum, item) => sum + item.total, 0);
        const numero = this.dados.orcamentos.length + 1;

        const orcamento = {
            id: Date.now(),
            numero: numero,
            data: document.getElementById('orcamentoData').value,
            clienteId: clienteId,
            clienteNome: cliente.nome,
            observacoes: document.getElementById('orcamentoObs').value,
            itens: this.orcamentoAtual.itens,
            total: total,
            status: 'Pendente'
        };

        this.dados.orcamentos.push(orcamento);
        this.salvarDados();
        this.listarOrcamentos();
        this.atualizarDashboard();
        this.fecharModal('modalOrcamento');
    }

    listarOrcamentos() {
        const tbody = document.getElementById('listaOrcamentos');
        
        if (this.dados.orcamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum orçamento cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = this.dados.orcamentos.map(orc => `
            <tr>
                <td>#${orc.numero}</td>
                <td>${this.formatarData(orc.data)}</td>
                <td>${orc.clienteNome}</td>
                <td>${this.formatarMoeda(orc.total)}</td>
                <td><span class="status-badge status-${orc.status.toLowerCase().replace(' ', '-')}">${orc.status}</span></td>
                <td>
                    <button class="action-btn btn-info" onclick="sistema.visualizarOrcamento(${orc.id})">Visualizar</button>
                    ${orc.status === 'Pendente' ? `<button class="action-btn btn-success" onclick="sistema.aprovarOrcamentoRapido(${orc.id})">Aprovar</button>` : ''}
                </td>
            </tr>
        `).join('');
    }

    visualizarOrcamento(id) {
        const orc = this.dados.orcamentos.find(o => o.id === id);
        if (!orc) return;

        this.editandoId = id;
        const cliente = this.dados.clientes.find(c => c.id === orc.clienteId);
        const config = this.dados.configuracoes;

        document.getElementById('viewOrcNumero').textContent = orc.numero;
        
        const html = `
            <div class="orcamento-header">
                <div class="empresa-info">
                    ${config.logo ? `<img src="${config.logo}" alt="Logo" style="max-width: 150px; margin-bottom: 10px;">` : ''}
                    <h3>${config.nome || 'Minha Empresa'}</h3>
                    <p>${config.cnpj ? 'CNPJ: ' + config.cnpj : ''}</p>
                    <p>${config.telefone || ''}</p>
                    <p>${config.email || ''}</p>
                    <p>${config.endereco || ''}</p>
                </div>
                <div class="cliente-info">
                    <h4>Cliente</h4>
                    <p><strong>${cliente.nome}</strong></p>
                    <p>${cliente.documento || ''}</p>
                    <p>${cliente.telefone || ''}</p>
                    <p>${cliente.email || ''}</p>
                    <p>${cliente.endereco || ''}</p>
                </div>
            </div>
            <div style="text-align: center; margin: 20px 0;">
                <h2>ORÇAMENTO #${orc.numero}</h2>
                <p>Data: ${this.formatarData(orc.data)}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="padding: 10px; border: 1px solid #ddd;">Produto/Serviço</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Qtd</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Valor Unit.</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${orc.itens.map(item => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;">${item.produtoNome}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantidade}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${this.formatarMoeda(item.preco)}</td>
                            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${this.formatarMoeda(item.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td colspan="3" style="padding: 10px; border: 1px solid #ddd; text-align: right;">TOTAL:</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${this.formatarMoeda(orc.total)}</td>
                    </tr>
                </tfoot>
            </table>
            ${orc.observacoes ? `<div style="margin-top: 20px;"><strong>Observações:</strong><br>${orc.observacoes}</div>` : ''}
            <div style="margin-top: 30px;">
                <p><strong>Status:</strong> <span class="status-badge status-${orc.status.toLowerCase().replace(' ', '-')}">${orc.status}</span></p>
            </div>
        `;

        document.getElementById('orcamentoImpressao').innerHTML = html;
        this.abrirModal('modalVisualizarOrcamento');
    }

    aprovarOrcamentoRapido(id) {
        this.editandoId = id;
        this.aprovarOrcamento();
    }

    aprovarOrcamento() {
        const id = this.editandoId;
        const orc = this.dados.orcamentos.find(o => o.id === id);
        
        if (!orc) return;

        if (confirm(`Deseja aprovar o orçamento #${orc.numero}?\n\nIsso irá:\n1. Marcar o orçamento como Aprovado\n2. Lançar o valor de R$ ${this.formatarMoeda(orc.total)} como "A receber" no financeiro`)) {
            // Atualizar status do orçamento
            orc.status = 'Aprovado';

            // Criar lançamento financeiro
            const lancamento = {
                id: Date.now(),
                data: new Date().toISOString().split('T')[0],
                descricao: `Orçamento #${orc.numero} - ${orc.clienteNome}`,
                categoria: 'A receber',
                valor: orc.total,
                vencimento: '',
                status: 'Pendente',
                orcamentoId: orc.id
            };

            this.dados.lancamentos.push(lancamento);
            this.salvarDados();
            this.listarOrcamentos();
            this.atualizarDashboard();
            this.fecharModal('modalVisualizarOrcamento');

            alert('Orçamento aprovado e lançado no financeiro com sucesso!');
        }
    }

    excluirOrcamento() {
        const id = this.editandoId;
        const orc = this.dados.orcamentos.find(o => o.id === id);
        
        if (confirm(`Deseja realmente excluir o orçamento #${orc.numero}?`)) {
            this.dados.orcamentos = this.dados.orcamentos.filter(o => o.id !== id);
            this.salvarDados();
            this.listarOrcamentos();
            this.atualizarDashboard();
            this.fecharModal('modalVisualizarOrcamento');
        }
    }

    // ==================== CONFIGURAÇÕES ====================
    salvarConfiguracoes() {
        this.dados.configuracoes = {
            nome: document.getElementById('configNome').value,
            cnpj: document.getElementById('configCnpj').value,
            telefone: document.getElementById('configTelefone').value,
            email: document.getElementById('configEmail').value,
            endereco: document.getElementById('configEndereco').value,
            logo: this.dados.configuracoes.logo || ''
        };

        this.salvarDados();
        this.carregarDados();
        alert('Configurações salvas com sucesso!');
    }

    carregarLogo(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const logoData = e.target.result;
                this.dados.configuracoes.logo = logoData;
                document.getElementById('logoPreview').src = logoData;
                document.getElementById('logoPreview').style.display = 'block';
                document.getElementById('configLogoPreview').src = logoData;
                document.getElementById('configLogoPreview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    // ==================== EXPORTAR/IMPORTAR ====================
    exportarDados() {
        const dataStr = JSON.stringify(this.dados, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-gestao-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        // Também copiar para área de transferência (útil no celular)
        if (navigator.clipboard) {
            navigator.clipboard.writeText(dataStr).then(() => {
                console.log('Dados copiados para área de transferência');
            });
        }
    }

    importarDados(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const dados = JSON.parse(e.target.result);
                    if (confirm('Isso irá substituir todos os dados atuais. Deseja continuar?')) {
                        this.dados = dados;
                        this.salvarDados();
                        this.carregarDados();
                        this.atualizarInterface();
                        alert('Dados importados com sucesso!');
                    }
                } catch (error) {
                    alert('Erro ao importar dados. Arquivo inválido.');
                }
            };
            reader.readAsText(file);
        }
    }

    // Compartilhar dados via WhatsApp/Email
    compartilharDados() {
        const dataStr = JSON.stringify(this.dados, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        // Criar arquivo temporário para compartilhar
        const fileName = `backup-gestao-${new Date().toISOString().split('T')[0]}.json`;
        
        // Se suportar Web Share API (celular)
        if (navigator.share) {
            const file = new File([dataBlob], fileName, { type: 'application/json' });
            navigator.share({
                title: 'Backup Sistema Gestão',
                text: 'Backup dos dados do sistema',
                files: [file]
            }).then(() => {
                console.log('Compartilhado com sucesso');
            }).catch((error) => {
                console.log('Erro ao compartilhar:', error);
                this.exportarDados(); // Fallback para download
            });
        } else {
            // Fallback: apenas download
            this.exportarDados();
        }
    }

    // Importar do Excel
    importarExcel(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                
                // Se for CSV
                if (file.name.endsWith('.csv')) {
                    this.processarCSV(text);
                } else {
                    alert('Para arquivos Excel (.xlsx), primeiro salve como CSV no Excel:\n\n1. Abra a planilha\n2. Arquivo → Salvar Como\n3. Tipo: CSV (separado por vírgulas)\n4. Importe o arquivo CSV aqui');
                }
            } catch (error) {
                alert('Erro ao ler o arquivo. Certifique-se que é um arquivo CSV válido.');
                console.error(error);
            }
        };
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            alert('Por favor, salve sua planilha Excel como CSV primeiro:\n\n1. Abra o Excel\n2. Arquivo → Salvar Como\n3. Escolha: CSV (separado por vírgulas)\n4. Salve\n5. Importe o arquivo CSV aqui');
        }
    }

    processarCSV(csv) {
        const linhas = csv.split('\n');
        let lancamentosImportados = 0;
        
        // Detectar separador (vírgula ou ponto-e-vírgula)
        const separador = csv.includes(';') ? ';' : ',';

        // Pular cabeçalho e linhas vazias
        for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i].trim();
            if (!linha) continue;

            // Dividir por separador detectado
            const colunas = linha.split(separador).map(col => col.trim().replace(/"/g, ''));
            
            // Pular se for cabeçalho ou linha de informação
            if (i === 0 || colunas[0].toLowerCase().includes('data') || colunas[1] === 'Coluna2') continue;
            
            // Formato esperado: Data,Descrição,Categoria,Valor,Vencimento,Status
            if (colunas.length >= 4 && colunas[1] && colunas[2] && colunas[3]) {
                const [data, descricao, categoria, valor, vencimento, status] = colunas;
                
                // Validar categoria
                const categoriasValidas = ['Devo', 'A receber', 'Débito', 'Pix', 'Crédito'];
                const categoriaFinal = categoriasValidas.includes(categoria) ? categoria : 'Devo';
                
                // Validar status
                const statusFinal = (status === 'Confirmado' || status === 'Pendente') ? status : 'Pendente';
                
                // Converter valor (aceita vírgula ou ponto como decimal)
                let valorNumerico = 0;
                if (valor) {
                    const valorLimpo = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
                    valorNumerico = parseFloat(valorLimpo) || 0;
                }
                
                const lancamento = {
                    id: Date.now() + i + Math.random(),
                    data: this.formatarDataParaISO(data) || new Date().toISOString().split('T')[0],
                    descricao: descricao || 'Importado do Excel',
                    categoria: categoriaFinal,
                    valor: valorNumerico,
                    vencimento: this.formatarDataParaISO(vencimento) || '',
                    status: statusFinal
                };

                if (lancamento.valor > 0 && lancamento.descricao !== 'Importado do Excel') {
                    this.dados.lancamentos.push(lancamento);
                    lancamentosImportados++;
                }
            }
        }

        if (lancamentosImportados > 0) {
            this.salvarDados();
            this.listarLancamentos();
            this.atualizarDashboard();
            alert(`✅ ${lancamentosImportados} lançamentos importados com sucesso!\n\nVá em "Financeiro" para visualizar.`);
        } else {
            alert('❌ Nenhum lançamento válido encontrado no arquivo.\n\nCertifique-se que o CSV está no formato:\nData,Descrição,Categoria,Valor,Vencimento,Status');
        }
    }

    formatarDataParaISO(data) {
        if (!data) return '';
        
        // Tentar formato DD/MM/YYYY
        if (data.includes('/')) {
            const partes = data.split('/');
            if (partes.length === 3) {
                const [dia, mes, ano] = partes;
                return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            }
        }
        
        // Se já estiver em formato ISO (YYYY-MM-DD)
        if (data.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return data;
        }
        
        return '';
    }

    // Carregar planilha existente do repositório
    async carregarPlanilhaExistente() {
        try {
            const resposta = await fetch('controle_financeiro_categorias_auto.csv');
            if (!resposta.ok) {
                throw new Error('Planilha não encontrada');
            }
            
            const csv = await resposta.text();
            
            // Ler saldo inicial da primeira linha
            const linhas = csv.split('\n');
            if (linhas[0] && linhas[0].includes('Saldo inicial')) {
                const partes = linhas[0].split(';');
                if (partes[1]) {
                    const saldoInicial = parseFloat(partes[1].replace(',', '.')) || 0;
                    this.dados.saldoInicial = saldoInicial;
                    document.getElementById('saldoInicial').value = saldoInicial;
                }
            }
            
            // Limpar lançamentos atuais
            if (confirm('Deseja substituir os lançamentos atuais pela planilha existente?')) {
                this.dados.lancamentos = [];
                this.processarCSV(csv);
                
                this.salvarDados();
                this.listarLancamentos();
                this.atualizarDashboard();
                
                alert(`✅ Planilha carregada com sucesso!\n\n📊 Saldo inicial: R$ ${saldoInicial.toFixed(2).replace('.', ',')}\n💰 Lançamentos importados\n\nVá em "Financeiro" ou "Dashboard" para visualizar.`);
            }
        } catch (erro) {
            console.error('Erro ao carregar planilha:', erro);
            alert('❌ Erro ao carregar planilha existente.\n\nCertifique-se que o arquivo "controle_financeiro_categorias_auto.csv" está na mesma pasta que o sistema.');
        }
    }

    // Exportar financeiro para CSV/Excel
    exportarFinanceiroCSV() {
        if (!this.dados.lancamentos || this.dados.lancamentos.length === 0) {
            alert('Nenhum lançamento financeiro para exportar!');
            return;
        }

        // Cabeçalho do CSV
        let csv = 'Data,Descrição,Categoria,Valor,Vencimento,Status\n';
        
        // Adicionar cada lançamento
        this.dados.lancamentos.forEach(lanc => {
            const data = this.formatarData(lanc.data);
            const descricao = `"${lanc.descricao.replace(/"/g, '""')}"`; // Escapar aspas
            const categoria = lanc.categoria;
            const valor = lanc.valor.toFixed(2).replace('.', ',');
            const vencimento = lanc.vencimento ? this.formatarData(lanc.vencimento) : '';
            const status = lanc.status;
            
            csv += `${data},${descricao},${categoria},${valor},${vencimento},${status}\n`;
        });
        
        // Criar e baixar arquivo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `financeiro-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        
        alert(`✅ Financeiro exportado com sucesso!\n\n${this.dados.lancamentos.length} lançamentos exportados.\n\nAbra o arquivo CSV no Excel para visualizar.`);
    }

    // ==================== UTILITÁRIOS ====================
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    formatarData(data) {
        if (!data) return '';
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    atualizarInterface() {
        this.atualizarDashboard();
        this.listarLancamentos();
        this.listarClientes();
        this.listarProdutos();
        this.listarOrcamentos();
    }
}

// Inicializar o sistema
const sistema = new SistemaGestao();
