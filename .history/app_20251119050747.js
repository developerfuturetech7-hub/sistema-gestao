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
            saldoInicial: 0,
            fechamentosMensais: [] // Novo: histórico de fechamentos mensais
        };
        this.editandoId = null;
        this.orcamentoAtual = {
            itens: []
        };
        this.filtroAtual = 'todos'; // Novo: controle do filtro de período
        this.init();
    }

    init() {
        this.carregarDados();
        this.configurarEventos();
        this.atualizarInterface();
        this.mostrarPagina('dashboard');
        
        // Carregar planilha automaticamente na primeira vez
        this.carregarPlanilhaAutomatica();
        
        // Popular filtro de período
        this.popularFiltroMesAno();
        
        // Garantir que o saldo inicial seja exibido
        setTimeout(() => {
            if (this.dados.saldoInicial) {
                document.getElementById('saldoInicial').value = this.dados.saldoInicial;
            }
        }, 100);
    }
    
    async carregarPlanilhaAutomatica() {
        // Verificar se já carregou a planilha antes
        const jaCarregou = localStorage.getItem('planilhaCarregada');
        
        if (!jaCarregou && this.dados.lancamentos.length === 0) {
            try {
                const resposta = await fetch('controle_financeiro_categorias_auto.csv');
                if (resposta.ok) {
                    const csv = await resposta.text();
                    
                    // Ler saldo inicial
                    const linhas = csv.split('\n');
                    if (linhas[0] && linhas[0].includes('Saldo inicial')) {
                        const partes = linhas[0].split(';');
                        if (partes[1]) {
                            const saldoInicial = parseFloat(partes[1].replace(',', '.')) || 0;
                            this.dados.saldoInicial = saldoInicial;
                            this.salvarDados();
                            setTimeout(() => {
                                document.getElementById('saldoInicial').value = saldoInicial;
                            }, 200);
                        }
                    }
                    
                    // Processar CSV
                    this.processarCSV(csv);
                    this.salvarDados();
                    
                    // Marcar que já carregou
                    localStorage.setItem('planilhaCarregada', 'true');
                    
                    this.atualizarInterface();
                    console.log('✅ Planilha carregada automaticamente!');
                }
            } catch (erro) {
                console.log('Planilha não encontrada ou erro ao carregar:', erro);
            }
        }
    }

    // ==================== GERENCIAMENTO DE DADOS ====================
    carregarDados() {
        const dadosSalvos = localStorage.getItem('sistemaGestao');
        if (dadosSalvos) {
            this.dados = JSON.parse(dadosSalvos);
            
            // Garantir que saldoInicial existe
            if (this.dados.saldoInicial === undefined || this.dados.saldoInicial === null) {
                this.dados.saldoInicial = 0;
            }
            
            // Migrar produtos antigos (custo/venda → precoCusto/precoVenda)
            if (this.dados.produtos && this.dados.produtos.length > 0) {
                this.dados.produtos = this.dados.produtos.map(prod => {
                    if (prod.custo !== undefined && prod.precoCusto === undefined) {
                        return {
                            ...prod,
                            precoCusto: prod.custo,
                            precoVenda: prod.venda
                        };
                    }
                    return prod;
                });
                this.salvarDados();
            }
        }
        
        // Carregar saldo inicial
        const campoSaldo = document.getElementById('saldoInicial');
        if (campoSaldo) {
            if (this.dados.saldoInicial !== undefined && this.dados.saldoInicial !== null) {
                campoSaldo.value = this.dados.saldoInicial;
                console.log('Saldo inicial carregado:', this.dados.saldoInicial);
            } else {
                campoSaldo.value = 0;
                this.dados.saldoInicial = 0;
            }
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
        console.log('Salvando dados... saldoInicial:', this.dados.saldoInicial);
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
        const campoSaldoInicial = document.getElementById('saldoInicial');
        campoSaldoInicial.addEventListener('input', (e) => {
            this.dados.saldoInicial = parseFloat(e.target.value) || 0;
            this.salvarDados();
        });
        campoSaldoInicial.addEventListener('change', (e) => {
            this.dados.saldoInicial = parseFloat(e.target.value) || 0;
            this.salvarDados();
            this.atualizarDashboard();
            console.log('Saldo inicial salvo:', this.dados.saldoInicial);
        });
        campoSaldoInicial.addEventListener('blur', (e) => {
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
        document.getElementById('btnRelatorioEstoque').addEventListener('click', () => this.mostrarRelatorioEstoque());
        document.getElementById('btnFecharRelatorio').addEventListener('click', () => this.fecharRelatorioEstoque());
        document.getElementById('btnImprimirRelatorio').addEventListener('click', () => window.print());

        // Orçamentos
        document.getElementById('btnNovoOrcamento').addEventListener('click', () => this.abrirModalOrcamento());
        document.getElementById('btnSalvarOrcamento').addEventListener('click', () => this.salvarOrcamento());
        document.getElementById('btnCancelarOrcamento').addEventListener('click', () => this.fecharModal('modalOrcamento'));
        document.getElementById('btnAdicionarItem').addEventListener('click', () => this.adicionarItemOrcamento());
        document.getElementById('btnImprimirOrcamento').addEventListener('click', () => window.print());
        document.getElementById('btnAprovarOrcamento').addEventListener('click', () => this.aprovarOrcamento());
        document.getElementById('btnExcluirOrcamento').addEventListener('click', () => this.excluirOrcamento());
        document.getElementById('btnFecharVisualizacao').addEventListener('click', () => this.fecharModal('modalVisualizarOrcamento'));
        document.getElementById('btnImprimirRecibo').addEventListener('click', () => window.print());
        document.getElementById('btnFecharRecibo').addEventListener('click', () => this.fecharModal('modalVisualizarRecibo'));
        
        // Relatório Financeiro
        document.getElementById('btnRelatorioFinanceiro').addEventListener('click', () => this.abrirRelatorioFinanceiro());
        document.getElementById('btnFecharRelatorioFinanceiro').addEventListener('click', () => this.fecharModal('modalRelatorioFinanceiro'));
        document.getElementById('btnImprimirRelatorioFinanceiro').addEventListener('click', () => window.print());
        
        // Filtros e Relatórios Mensais
        document.getElementById('filtroMesAno').addEventListener('change', (e) => this.filtrarPorPeriodo(e.target.value));
        document.getElementById('btnRelatorioMensal').addEventListener('click', () => this.abrirRelatorioMensal());
        document.getElementById('btnFecharRelatorioMensal').addEventListener('click', () => this.fecharModal('modalRelatorioMensal'));
        document.getElementById('btnImprimirRelatorioMensal').addEventListener('click', () => window.print());
        document.getElementById('btnComparativoMensal').addEventListener('click', () => this.abrirComparativoMensal());
        document.getElementById('btnFecharComparativo').addEventListener('click', () => this.fecharModal('modalComparativoMensal'));
        document.getElementById('btnImprimirComparativo').addEventListener('click', () => window.print());
        document.getElementById('btnFecharMes').addEventListener('click', () => this.fecharMesAtual());

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
        
        document.getElementById('saldoInicial').textContent = this.formatarMoeda(calculos.saldoInicial);
        document.getElementById('entradasConfirmadas').textContent = this.formatarMoeda(calculos.entradasConfirmadas);
        document.getElementById('saidasConfirmadas').textContent = this.formatarMoeda(calculos.saidasConfirmadas);
        document.getElementById('saldoAtualConta').textContent = this.formatarMoeda(calculos.saldoAtualConta);
        document.getElementById('devidoPendente').textContent = this.formatarMoeda(calculos.devidoPendente);
        document.getElementById('receberPendente').textContent = this.formatarMoeda(calculos.receberPendente);
        document.getElementById('saldoProjetado').textContent = this.formatarMoeda(calculos.saldoProjetado);
        document.getElementById('saldoAtrasado').textContent = this.formatarMoeda(calculos.saldoAtrasado);
        document.getElementById('totalOrcamentos').textContent = this.dados.orcamentos.length;

        this.atualizarUltimosLancamentos();
        this.atualizarOrcamentosPendentes();
    }

    calcularSaldos() {
        const saldoInicial = this.dados.saldoInicial || 0;
        let entradasConfirmadas = 0;
        let saidasConfirmadas = 0;
        let devidoPendente = 0;
        let receberPendente = 0;
        let saldoAtrasado = 0;
        const hoje = new Date().toISOString().split('T')[0];

        this.dados.lancamentos.forEach(lanc => {
            const valor = parseFloat(lanc.valor) || 0;
            
            if (lanc.status === 'Confirmado') {
                // Confirmados afetam o saldo atual
                if (lanc.categoria === 'Devo' || lanc.categoria === 'Débito' || lanc.categoria === 'Crédito') {
                    // SAÍDAS
                    saidasConfirmadas += valor;
                } else if (lanc.categoria === 'A receber' || lanc.categoria === 'Pix') {
                    // ENTRADAS
                    entradasConfirmadas += valor;
                }
            } else {
                // Pendentes
                if (lanc.categoria === 'Devo') {
                    devidoPendente += valor;
                    if (lanc.vencimento && lanc.vencimento < hoje) {
                        saldoAtrasado += valor;
                    }
                } else if (lanc.categoria === 'A receber') {
                    receberPendente += valor;
                    if (lanc.vencimento && lanc.vencimento < hoje) {
                        saldoAtrasado += valor;
                    }
                }
            }
        });

        // Cálculos finais
        const saldoAtualConta = saldoInicial + entradasConfirmadas - saidasConfirmadas;
        const saldoProjetado = saldoAtualConta + receberPendente - devidoPendente;

        return {
            saldoInicial,
            entradasConfirmadas,
            saidasConfirmadas,
            saldoAtualConta,
            devidoPendente,
            receberPendente,
            saldoProjetado,
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
        
        // Atualizar datalist de clientes e select de produtos
        this.atualizarDatalistClientes();
        this.atualizarSelectProdutosLancamento();
        
        if (id) {
            const lanc = this.dados.lancamentos.find(l => l.id === id);
            if (lanc) {
                document.getElementById('lancamentoData').value = lanc.data;
                document.getElementById('lancamentoDescricao').value = lanc.descricao;
                document.getElementById('lancamentoNome').value = lanc.nome || '';
                document.getElementById('lancamentoCategoria').value = lanc.categoria;
                document.getElementById('lancamentoProduto').value = lanc.produtoId || '';
                document.getElementById('lancamentoValor').value = lanc.valor;
                document.getElementById('lancamentoVencimento').value = lanc.vencimento;
                document.getElementById('lancamentoStatus').value = lanc.status;
                document.getElementById('lancamentoObs').value = lanc.observacoes || '';
            }
        } else {
            document.getElementById('lancamentoData').value = new Date().toISOString().split('T')[0];
            document.getElementById('lancamentoDescricao').value = '';
            document.getElementById('lancamentoNome').value = '';
            document.getElementById('lancamentoCategoria').value = 'Devo';
            document.getElementById('lancamentoProduto').value = '';
            document.getElementById('lancamentoValor').value = '';
            document.getElementById('lancamentoVencimento').value = '';
            document.getElementById('lancamentoStatus').value = 'Pendente';
            document.getElementById('lancamentoObs').value = '';
        }
        
        this.abrirModal('modalLancamento');
    }

    salvarLancamento() {
        const lancamento = {
            id: this.editandoId || Date.now(),
            data: document.getElementById('lancamentoData').value,
            descricao: document.getElementById('lancamentoDescricao').value,
            nome: document.getElementById('lancamentoNome').value,
            categoria: document.getElementById('lancamentoCategoria').value,
            produtoId: document.getElementById('lancamentoProduto').value,
            valor: parseFloat(document.getElementById('lancamentoValor').value) || 0,
            vencimento: document.getElementById('lancamentoVencimento').value,
            status: document.getElementById('lancamentoStatus').value,
            observacoes: document.getElementById('lancamentoObs').value
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

        const hoje = new Date().toISOString().split('T')[0];

        tbody.innerHTML = this.dados.lancamentos.map(lanc => {
            // Verificar se está vencido
            const estaVencido = lanc.vencimento && lanc.vencimento < hoje && lanc.status === 'Pendente';
            const vencimentoTexto = lanc.vencimento ? this.formatarData(lanc.vencimento) : '-';
            const vencimentoClass = estaVencido ? 'style="color: red; font-weight: bold;"' : '';
            const vencimentoLabel = estaVencido ? `${vencimentoTexto} ⚠️` : vencimentoTexto;
            
            return `
            <tr ${estaVencido ? 'style="background-color: #fff3f3;"' : ''}>
                <td>${this.formatarData(lanc.data)}</td>
                <td>${lanc.descricao}</td>
                <td>${lanc.categoria}</td>
                <td>${this.formatarMoeda(lanc.valor)}</td>
                <td ${vencimentoClass}>${vencimentoLabel}</td>
                <td>
                    <span class="status-badge status-${lanc.status.toLowerCase()}" 
                          onclick="sistema.toggleStatus(${lanc.id})" 
                          style="cursor: pointer;" 
                          title="Clique para ${lanc.status === 'Pendente' ? 'marcar como PAGO/RECEBIDO' : 'marcar como PENDENTE'}">
                        ${lanc.status === 'Pendente' ? '⏳ Pendente' : '✅ Confirmado'}
                    </span>
                </td>
                <td>
                    <button class="action-btn btn-info" onclick="sistema.visualizarRecibo(${lanc.id})" title="Gerar Recibo">📝 Recibo</button>
                    <button class="action-btn btn-primary" onclick="sistema.abrirModalLancamento(${lanc.id})">Editar</button>
                    <button class="action-btn btn-danger" onclick="sistema.excluirLancamento(${lanc.id})">Excluir</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    excluirLancamento(id) {
        if (confirm('Deseja realmente excluir este lançamento?')) {
            this.dados.lancamentos = this.dados.lancamentos.filter(l => l.id !== id);
            this.salvarDados();
            this.listarLancamentos();
            this.atualizarDashboard();
        }
    }

    toggleStatus(id) {
        const lancamento = this.dados.lancamentos.find(l => l.id === id);
        if (lancamento) {
            // Alternar entre Pendente e Confirmado
            lancamento.status = lancamento.status === 'Pendente' ? 'Confirmado' : 'Pendente';
            this.salvarDados();
            this.listarLancamentos();
            this.atualizarDashboard();
        }
    }

    visualizarRecibo(id) {
        const lanc = this.dados.lancamentos.find(l => l.id === id);
        if (!lanc) return;

        const config = this.dados.configuracoes;
        const hoje = new Date().toLocaleDateString('pt-BR');
        const valorExtenso = this.valorPorExtenso(lanc.valor);

        document.getElementById('viewReciboNumero').textContent = id;
        
        const html = `
            <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                    ${config.logo ? `<img src="${config.logo}" alt="Logo" style="max-width: 120px; margin-bottom: 10px;">` : ''}
                    <h2 style="margin: 10px 0; color: #2c3e50;">${config.nome || 'Minha Empresa'}</h2>
                    <p style="margin: 3px 0; font-size: 13px;"><strong>CNPJ:</strong> ${config.cnpj || ''}</p>
                    <p style="margin: 3px 0; font-size: 13px;">${config.telefone || ''} | ${config.email || ''}</p>
                    <p style="margin: 3px 0; font-size: 13px;">${config.endereco || ''}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <h1 style="margin: 10px 0; color: #2c3e50; font-size: 32px;">RECIBO</h1>
                    <p style="margin: 5px 0; font-size: 14px;">Nº ${id}</p>
                </div>
                
                <div style="margin: 30px 0; line-height: 2; font-size: 15px;">
                    <p style="text-align: justify; text-indent: 50px;">
                        Recebi(emos) de <strong>${lanc.nome || '___________________________'}</strong> 
                        a importância de <strong>${this.formatarMoeda(lanc.valor)}</strong> 
                        (<strong>${valorExtenso}</strong>), 
                        referente a <strong>${lanc.descricao}</strong>.
                    </p>
                </div>
                
                ${lanc.observacoes ? `
                    <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
                        <strong style="color: #2c3e50;">Observações:</strong><br>
                        <span style="font-size: 13px;">${lanc.observacoes}</span>
                    </div>
                ` : ''}
                
                <div style="margin-top: 60px; text-align: center;">
                    <p style="font-size: 14px;">
                        ${config.endereco ? config.endereco.split(',')[0] + ', ' : ''} 
                        ${this.formatarData(lanc.data) || hoje}
                    </p>
                </div>
                
                <div style="margin-top: 80px; text-align: center;">
                    <div style="border-top: 2px solid #333; width: 300px; margin: 0 auto; padding-top: 10px;">
                        <p style="font-size: 14px; margin: 5px 0;"><strong>${config.nome || 'Assinatura'}</strong></p>
                        <p style="font-size: 12px; margin: 5px 0;">${config.cnpj || ''}</p>
                    </div>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #999; text-align: center;">
                    <p style="font-size: 12px; color: #666;">
                        <strong>Categoria:</strong> ${lanc.categoria} | 
                        <strong>Status:</strong> ${lanc.status} | 
                        <strong>Data Lançamento:</strong> ${this.formatarData(lanc.data)}
                    </p>
                </div>
            </div>
        `;

        document.getElementById('reciboImpressao').innerHTML = html;
        this.abrirModal('modalVisualizarRecibo');
    }

    valorPorExtenso(valor) {
        const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
        
        const inteiro = Math.floor(valor);
        const centavos = Math.round((valor - inteiro) * 100);
        
        let extenso = '';
        
        if (inteiro === 0) {
            extenso = 'zero reais';
        } else if (inteiro === 1) {
            extenso = 'um real';
        } else if (inteiro < 1000) {
            const c = Math.floor(inteiro / 100);
            const d = Math.floor((inteiro % 100) / 10);
            const u = inteiro % 10;
            
            if (c > 0) extenso += (c === 1 && inteiro === 100) ? 'cem' : centenas[c];
            if (d > 0 || u > 0) {
                if (c > 0) extenso += ' e ';
                if (d === 1) extenso += especiais[u];
                else {
                    extenso += dezenas[d];
                    if (u > 0) extenso += (d > 0 ? ' e ' : '') + unidades[u];
                }
            }
            extenso += ' reais';
        } else {
            extenso = inteiro.toLocaleString('pt-BR') + ' reais';
        }
        
        if (centavos > 0) {
            extenso += ' e ' + centavos + ' centavos';
        }
        
        return extenso;
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
        this.atualizarDatalistClientes(); // Atualiza autocomplete de lançamentos
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

    atualizarDatalistClientes() {
        const datalist = document.getElementById('clientesDatalist');
        if (!datalist) return;
        
        datalist.innerHTML = this.dados.clientes.map(cliente => 
            `<option value="${cliente.nome}">`
        ).join('');
    }

    atualizarSelectProdutosLancamento() {
        const select = document.getElementById('lancamentoProduto');
        if (!select) return;
        
        select.innerHTML = '<option value="">Nenhum</option>' +
            this.dados.produtos.map(prod => 
                `<option value="${prod.id}">${prod.descricao} - ${this.formatarMoeda(prod.precoVenda)}</option>`
            ).join('');
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
                document.getElementById('produtoCusto').value = produto.precoCusto || produto.custo || 0;
                document.getElementById('produtoVenda').value = produto.precoVenda || produto.venda || 0;
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
            precoCusto: parseFloat(document.getElementById('produtoCusto').value) || 0,
            precoVenda: parseFloat(document.getElementById('produtoVenda').value) || 0,
            unidade: document.getElementById('produtoUnidade').value
        };

        if (!produto.descricao || !produto.precoVenda) {
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
            const margem = produto.precoCusto > 0 ? ((produto.precoVenda - produto.precoCusto) / produto.precoCusto * 100).toFixed(2) : 0;
            return `
                <tr>
                    <td>${produto.codigo || '-'}</td>
                    <td>${produto.descricao}</td>
                    <td>${this.formatarMoeda(produto.precoCusto)}</td>
                    <td>${this.formatarMoeda(produto.precoVenda)}</td>
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

    mostrarRelatorioEstoque() {
        // Esconder tabela de produtos e mostrar relatório
        document.querySelector('#produtos-page .table-container').style.display = 'none';
        document.getElementById('relatorioEstoque').style.display = 'block';
        document.getElementById('btnNovoProduto').style.display = 'none';
        document.getElementById('btnRelatorioEstoque').style.display = 'none';
        
        // Adicionar logo e cabeçalho ao relatório
        const config = this.dados.configuracoes;
        const relatorioDiv = document.getElementById('relatorioEstoque');
        const h2 = relatorioDiv.querySelector('h2');
        
        // Inserir cabeçalho com logo antes do h2
        const cabecalho = `
            <div style="text-align: center; padding: 20px; border-bottom: 2px solid #ddd; margin-bottom: 20px;">
                ${config.logo ? `<img src="${config.logo}" alt="Logo" style="max-width: 150px; margin-bottom: 10px;">` : ''}
                <h3 style="margin: 5px 0;">${config.nome || 'Minha Empresa'}</h3>
                <p style="margin: 3px 0; font-size: 13px;">${config.cnpj || ''}</p>
            </div>
        `;
        
        if (!relatorioDiv.querySelector('.cabecalho-relatorio')) {
            h2.insertAdjacentHTML('beforebegin', `<div class="cabecalho-relatorio">${cabecalho}</div>`);
        }
        
        this.gerarRelatorioEstoque();
    }

    fecharRelatorioEstoque() {
        document.querySelector('#produtos-page .table-container').style.display = 'block';
        document.getElementById('relatorioEstoque').style.display = 'none';
        document.getElementById('btnNovoProduto').style.display = 'inline-block';
        document.getElementById('btnRelatorioEstoque').style.display = 'inline-block';
    }

    gerarRelatorioEstoque() {
        let totalCusto = 0;
        let totalVenda = 0;
        let somaMargens = 0;
        
        const tbody = document.getElementById('tabelaRelatorioEstoque');
        
        if (this.dados.produtos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum produto cadastrado</td></tr>';
            document.getElementById('totalCusto').textContent = 'R$ 0,00';
            document.getElementById('totalVenda').textContent = 'R$ 0,00';
            document.getElementById('lucroPotencial').textContent = 'R$ 0,00';
            document.getElementById('margemMedia').textContent = '0%';
            return;
        }
        
        tbody.innerHTML = this.dados.produtos.map(prod => {
            const custo = parseFloat(prod.precoCusto) || 0;
            const venda = parseFloat(prod.precoVenda) || 0;
            const lucro = venda - custo;
            const margem = custo > 0 ? ((lucro / custo) * 100) : 0;
            
            totalCusto += custo;
            totalVenda += venda;
            somaMargens += margem;
            
            return `
                <tr>
                    <td>${prod.codigo}</td>
                    <td>${prod.descricao}</td>
                    <td>${this.formatarMoeda(custo)}</td>
                    <td>${this.formatarMoeda(venda)}</td>
                    <td style="color: ${lucro >= 0 ? 'green' : 'red'}; font-weight: bold;">${this.formatarMoeda(lucro)}</td>
                    <td style="font-weight: bold;">${margem.toFixed(2)}%</td>
                </tr>
            `;
        }).join('');
        
        const lucroPotencial = totalVenda - totalCusto;
        const margemMedia = this.dados.produtos.length > 0 ? (somaMargens / this.dados.produtos.length) : 0;
        
        document.getElementById('totalCusto').textContent = this.formatarMoeda(totalCusto);
        document.getElementById('totalVenda').textContent = this.formatarMoeda(totalVenda);
        document.getElementById('lucroPotencial').textContent = this.formatarMoeda(lucroPotencial);
        document.getElementById('lucroPotencial').style.color = lucroPotencial >= 0 ? '#27ae60' : '#e74c3c';
        document.getElementById('margemMedia').textContent = margemMedia.toFixed(2) + '%';
    }

    // ==================== RELATÓRIO FINANCEIRO ====================
    abrirRelatorioFinanceiro() {
        const config = this.dados.configuracoes;
        const calculos = this.calcularSaldos();
        const dataAtual = new Date().toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Ordenar lançamentos por data
        const lancamentosOrdenados = [...this.dados.lancamentos].sort((a, b) => 
            new Date(a.data) - new Date(b.data)
        );
        
        // Separar confirmados e pendentes
        const confirmados = lancamentosOrdenados.filter(l => l.status === 'Confirmado');
        const pendentes = lancamentosOrdenados.filter(l => l.status === 'Pendente');
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
                <!-- Cabeçalho com Logo -->
                <div style="text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px;">
                    ${config.logo ? `<img src="${config.logo}" alt="Logo" style="max-width: 180px; margin-bottom: 15px;">` : ''}
                    <h2 style="margin: 10px 0; color: #2c3e50;">${config.nome || 'Minha Empresa'}</h2>
                    <p style="margin: 5px 0; color: #555;">CNPJ: ${config.cnpj || 'Não informado'}</p>
                    <p style="margin: 5px 0; color: #555;">${config.endereco || ''}</p>
                    <p style="margin: 5px 0; color: #555;">Tel: ${config.telefone || ''} | Email: ${config.email || ''}</p>
                </div>
                
                <!-- Título do Relatório -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2c3e50; margin: 10px 0;">📊 RELATÓRIO FINANCEIRO COMPLETO</h1>
                    <p style="color: #555; font-size: 14px;">Emitido em: ${dataAtual}</p>
                </div>
                
                <!-- Resumo Executivo -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                    <h3 style="margin-top: 0; text-align: center; font-size: 20px;">💰 RESUMO EXECUTIVO</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                            <div style="font-size: 13px; opacity: 0.9;">Saldo Inicial</div>
                            <div style="font-size: 24px; font-weight: bold; margin-top: 5px;">${this.formatarMoeda(calculos.saldoInicial)}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                            <div style="font-size: 13px; opacity: 0.9;">Saldo Atual (Conta)</div>
                            <div style="font-size: 24px; font-weight: bold; margin-top: 5px;">${this.formatarMoeda(calculos.saldoAtualConta)}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                            <div style="font-size: 13px; opacity: 0.9;">A Receber</div>
                            <div style="font-size: 24px; font-weight: bold; margin-top: 5px; color: #4ade80;">${this.formatarMoeda(calculos.receberPendente)}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                            <div style="font-size: 13px; opacity: 0.9;">Devo</div>
                            <div style="font-size: 24px; font-weight: bold; margin-top: 5px; color: #f87171;">${this.formatarMoeda(calculos.devidoPendente)}</div>
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.3); padding: 20px; border-radius: 8px; margin-top: 15px; text-align: center;">
                        <div style="font-size: 14px; opacity: 0.9;">💎 SALDO PROJETADO</div>
                        <div style="font-size: 32px; font-weight: bold; margin-top: 8px;">${this.formatarMoeda(calculos.saldoProjetado)}</div>
                    </div>
                </div>
                
                <!-- Movimentações Confirmadas -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">✅ MOVIMENTAÇÕES CONFIRMADAS</h3>
                    ${confirmados.length > 0 ? `
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <thead>
                                <tr style="background-color: #ecf0f1;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Data</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Descrição</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Categoria</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #bdc3c7;">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${confirmados.map(lanc => `
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid #ecf0f1;">${this.formatarData(lanc.data)}</td>
                                        <td style="padding: 10px; border: 1px solid #ecf0f1;">${lanc.descricao}</td>
                                        <td style="padding: 10px; border: 1px solid #ecf0f1;"><span style="background: #3498db; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">${lanc.categoria}</span></td>
                                        <td style="padding: 10px; border: 1px solid #ecf0f1; text-align: right; font-weight: bold; color: ${lanc.valor >= 0 ? '#27ae60' : '#e74c3c'};">${this.formatarMoeda(Math.abs(lanc.valor))}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p style="text-align: center; color: #95a5a6; padding: 20px;">Nenhuma movimentação confirmada</p>'}
                </div>
                
                <!-- Movimentações Pendentes -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #2c3e50; border-bottom: 2px solid #f39c12; padding-bottom: 10px;">⏳ MOVIMENTAÇÕES PENDENTES</h3>
                    ${pendentes.length > 0 ? `
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <thead>
                                <tr style="background-color: #fff9e6;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #f1c40f;">Data</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #f1c40f;">Descrição</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #f1c40f;">Categoria</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #f1c40f;">Vencimento</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #f1c40f;">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pendentes.map(lanc => {
                                    const vencido = lanc.vencimento && new Date(lanc.vencimento + 'T00:00:00') < new Date();
                                    return `
                                        <tr style="${vencido ? 'background-color: #fee;' : ''}">
                                            <td style="padding: 10px; border: 1px solid #fef5e7;">${this.formatarData(lanc.data)}</td>
                                            <td style="padding: 10px; border: 1px solid #fef5e7;">${lanc.descricao}</td>
                                            <td style="padding: 10px; border: 1px solid #fef5e7;"><span style="background: #f39c12; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">${lanc.categoria}</span></td>
                                            <td style="padding: 10px; border: 1px solid #fef5e7; ${vencido ? 'color: #e74c3c; font-weight: bold;' : ''}">${lanc.vencimento ? this.formatarData(lanc.vencimento) : '-'}</td>
                                            <td style="padding: 10px; border: 1px solid #fef5e7; text-align: right; font-weight: bold; color: ${lanc.valor >= 0 ? '#27ae60' : '#e74c3c'};">${this.formatarMoeda(Math.abs(lanc.valor))}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    ` : '<p style="text-align: center; color: #95a5a6; padding: 20px;">Nenhuma movimentação pendente</p>'}
                </div>
                
                <!-- Análise por Categoria -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #2c3e50; border-bottom: 2px solid #9b59b6; padding-bottom: 10px;">📂 ANÁLISE POR CATEGORIA</h3>
                    ${this.gerarAnaliseCategoria()}
                </div>
                
                <!-- Rodapé -->
                <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center; color: #7f8c8d; font-size: 12px;">
                    <p style="margin: 5px 0;">💻 Desenvolvido Por <strong>Future Tech Developer©</strong> 2025 Todos os direitos Reservados</p>
                    <p style="margin: 5px 0;"><strong>Future Tech Informatica</strong></p>
                    <p style="margin: 10px 0;">Relatório gerado automaticamente pelo Sistema de Gestão Financeira</p>
                </div>
            </div>
        `;
        
        document.getElementById('relatorioFinanceiroImpressao').innerHTML = html;
        this.abrirModal('modalRelatorioFinanceiro');
    }
    
    gerarAnaliseCategoria() {
        const categorias = {};
        
        this.dados.lancamentos.forEach(lanc => {
            if (!categorias[lanc.categoria]) {
                categorias[lanc.categoria] = { total: 0, quantidade: 0 };
            }
            categorias[lanc.categoria].total += lanc.valor;
            categorias[lanc.categoria].quantidade++;
        });
        
        const categoriaArray = Object.entries(categorias)
            .sort((a, b) => Math.abs(b[1].total) - Math.abs(a[1].total));
        
        if (categoriaArray.length === 0) {
            return '<p style="text-align: center; color: #95a5a6; padding: 20px;">Nenhuma movimentação cadastrada</p>';
        }
        
        return `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr style="background-color: #f3e5f5;">
                        <th style="padding: 12px; text-align: left; border: 1px solid #9b59b6;">Categoria</th>
                        <th style="padding: 12px; text-align: center; border: 1px solid #9b59b6;">Quantidade</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #9b59b6;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${categoriaArray.map(([cat, dados]) => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #f3e5f5;"><strong>${cat}</strong></td>
                            <td style="padding: 10px; border: 1px solid #f3e5f5; text-align: center;">${dados.quantidade}</td>
                            <td style="padding: 10px; border: 1px solid #f3e5f5; text-align: right; font-weight: bold; color: ${dados.total >= 0 ? '#27ae60' : '#e74c3c'};">${this.formatarMoeda(dados.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ==================== FILTROS E RELATÓRIOS MENSAIS ====================
    popularFiltroMesAno() {
        const select = document.getElementById('filtroMesAno');
        const mesesUnicos = new Set();
        
        this.dados.lancamentos.forEach(lanc => {
            const data = new Date(lanc.data + 'T00:00:00');
            const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            mesesUnicos.add(mesAno);
        });
        
        // Adicionar fechamentos mensais salvos
        if (this.dados.fechamentosMensais) {
            this.dados.fechamentosMensais.forEach(f => {
                mesesUnicos.add(f.mesAno);
            });
        }
        
        const mesesOrdenados = Array.from(mesesUnicos).sort().reverse();
        
        select.innerHTML = '<option value="todos">📊 Todos os Períodos</option>';
        
        mesesOrdenados.forEach(mesAno => {
            const [ano, mes] = mesAno.split('-');
            const nomeMes = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            select.innerHTML += `<option value="${mesAno}">${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}</option>`;
        });
    }
    
    filtrarPorPeriodo(mesAno) {
        this.filtroAtual = mesAno;
        this.listarLancamentos();
        // NÃO atualizar dashboard - ele sempre mostra todos os dados
    }
    
    getLancamentosFiltrados() {
        if (this.filtroAtual === 'todos') {
            return this.dados.lancamentos;
        }
        
        return this.dados.lancamentos.filter(lanc => {
            const data = new Date(lanc.data + 'T00:00:00');
            const mesAnoLanc = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            return mesAnoLanc === this.filtroAtual;
        });
    }
    
    abrirRelatorioMensal() {
        const mesAnoSelecionado = this.filtroAtual;
        
        if (mesAnoSelecionado === 'todos') {
            alert('Selecione um mês específico no filtro para gerar o relatório mensal!');
            return;
        }
        
        const [ano, mes] = mesAnoSelecionado.split('-');
        const nomeMes = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const config = this.dados.configuracoes;
        
        const lancamentosMes = this.getLancamentosFiltrados();
        const confirmados = lancamentosMes.filter(l => l.status === 'Confirmado');
        const pendentes = lancamentosMes.filter(l => l.status === 'Pendente');
        
        const entradasConfirmadas = confirmados.filter(l => l.valor > 0).reduce((sum, l) => sum + l.valor, 0);
        const saidasConfirmadas = confirmados.filter(l => l.valor < 0).reduce((sum, l) => sum + Math.abs(l.valor), 0);
        const receberPendente = pendentes.filter(l => l.valor > 0).reduce((sum, l) => sum + l.valor, 0);
        const devidoPendente = pendentes.filter(l => l.valor < 0).reduce((sum, l) => sum + Math.abs(l.valor), 0);
        const saldoMes = entradasConfirmadas - saidasConfirmadas;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px;">
                    ${config.logo ? `<img src="${config.logo}" alt="Logo" style="max-width: 180px; margin-bottom: 15px;">` : ''}
                    <h2 style="margin: 10px 0; color: #2c3e50;">${config.nome || 'Minha Empresa'}</h2>
                    <p style="margin: 5px 0; color: #555;">CNPJ: ${config.cnpj || 'Não informado'}</p>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2c3e50; margin: 10px 0;">📅 RELATÓRIO MENSAL</h1>
                    <h2 style="color: #3498db; margin: 10px 0;">${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}</h2>
                </div>
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                    <h3 style="margin-top: 0; text-align: center; font-size: 20px;">💰 RESUMO DO MÊS</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                            <div style="font-size: 13px; opacity: 0.9;">Entradas Confirmadas</div>
                            <div style="font-size: 24px; font-weight: bold; margin-top: 5px; color: #4ade80;">${this.formatarMoeda(entradasConfirmadas)}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                            <div style="font-size: 13px; opacity: 0.9;">Saídas Confirmadas</div>
                            <div style="font-size: 24px; font-weight: bold; margin-top: 5px; color: #f87171;">${this.formatarMoeda(saidasConfirmadas)}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                            <div style="font-size: 13px; opacity: 0.9;">A Receber (Pendente)</div>
                            <div style="font-size: 24px; font-weight: bold; margin-top: 5px;">${this.formatarMoeda(receberPendente)}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
                            <div style="font-size: 13px; opacity: 0.9;">Devo (Pendente)</div>
                            <div style="font-size: 24px; font-weight: bold; margin-top: 5px;">${this.formatarMoeda(devidoPendente)}</div>
                        </div>
                    </div>
                    <div style="background: rgba(255,255,255,0.3); padding: 20px; border-radius: 8px; margin-top: 15px; text-align: center;">
                        <div style="font-size: 14px; opacity: 0.9;">💎 SALDO DO MÊS</div>
                        <div style="font-size: 32px; font-weight: bold; margin-top: 8px; color: ${saldoMes >= 0 ? '#4ade80' : '#f87171'};">${this.formatarMoeda(saldoMes)}</div>
                    </div>
                </div>
                
                ${confirmados.length > 0 ? `
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">✅ MOVIMENTAÇÕES CONFIRMADAS</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <thead>
                                <tr style="background-color: #ecf0f1;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Data</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Descrição</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #bdc3c7;">Categoria</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #bdc3c7;">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${confirmados.map(lanc => `
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid #ecf0f1;">${this.formatarData(lanc.data)}</td>
                                        <td style="padding: 10px; border: 1px solid #ecf0f1;">${lanc.descricao}</td>
                                        <td style="padding: 10px; border: 1px solid #ecf0f1;"><span style="background: #3498db; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">${lanc.categoria}</span></td>
                                        <td style="padding: 10px; border: 1px solid #ecf0f1; text-align: right; font-weight: bold; color: ${lanc.valor >= 0 ? '#27ae60' : '#e74c3c'};">${this.formatarMoeda(Math.abs(lanc.valor))}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
                
                ${pendentes.length > 0 ? `
                    <div style="margin-bottom: 30px;">
                        <h3 style="color: #2c3e50; border-bottom: 2px solid #f39c12; padding-bottom: 10px;">⏳ MOVIMENTAÇÕES PENDENTES</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <thead>
                                <tr style="background-color: #fff9e6;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #f1c40f;">Data</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #f1c40f;">Descrição</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #f1c40f;">Categoria</th>
                                    <th style="padding: 12px; text-align: right; border: 1px solid #f1c40f;">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pendentes.map(lanc => `
                                    <tr>
                                        <td style="padding: 10px; border: 1px solid #fef5e7;">${this.formatarData(lanc.data)}</td>
                                        <td style="padding: 10px; border: 1px solid #fef5e7;">${lanc.descricao}</td>
                                        <td style="padding: 10px; border: 1px solid #fef5e7;"><span style="background: #f39c12; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">${lanc.categoria}</span></td>
                                        <td style="padding: 10px; border: 1px solid #fef5e7; text-align: right; font-weight: bold; color: ${lanc.valor >= 0 ? '#27ae60' : '#e74c3c'};">${this.formatarMoeda(Math.abs(lanc.valor))}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center; color: #7f8c8d; font-size: 12px;">
                    <p style="margin: 5px 0;">💻 Desenvolvido Por <strong>Future Tech Developer©</strong> 2025 Todos os direitos Reservados</p>
                    <p style="margin: 5px 0;"><strong>Future Tech Informatica</strong></p>
                </div>
            </div>
        `;
        
        document.getElementById('relatorioMensalImpressao').innerHTML = html;
        this.abrirModal('modalRelatorioMensal');
    }
    
    abrirComparativoMensal() {
        const config = this.dados.configuracoes;
        const mesesUnicos = new Set();
        
        this.dados.lancamentos.forEach(lanc => {
            const data = new Date(lanc.data + 'T00:00:00');
            const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            mesesUnicos.add(mesAno);
        });
        
        const mesesOrdenados = Array.from(mesesUnicos).sort();
        const comparativo = [];
        
        mesesOrdenados.forEach(mesAno => {
            const [ano, mes] = mesAno.split('-');
            const nomeMes = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            
            const lancamentosMes = this.dados.lancamentos.filter(lanc => {
                const data = new Date(lanc.data + 'T00:00:00');
                const mesAnoLanc = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
                return mesAnoLanc === mesAno;
            });
            
            const confirmados = lancamentosMes.filter(l => l.status === 'Confirmado');
            const entradas = confirmados.filter(l => l.valor > 0).reduce((sum, l) => sum + l.valor, 0);
            const saidas = confirmados.filter(l => l.valor < 0).reduce((sum, l) => sum + Math.abs(l.valor), 0);
            const saldo = entradas - saidas;
            
            comparativo.push({ mesAno: nomeMes, entradas, saidas, saldo });
        });
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px;">
                    ${config.logo ? `<img src="${config.logo}" alt="Logo" style="max-width: 180px; margin-bottom: 15px;">` : ''}
                    <h2 style="margin: 10px 0; color: #2c3e50;">${config.nome || 'Minha Empresa'}</h2>
                    <p style="margin: 5px 0; color: #555;">CNPJ: ${config.cnpj || 'Não informado'}</p>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2c3e50; margin: 10px 0;">📊 COMPARATIVO MENSAL</h1>
                    <p style="color: #555; font-size: 14px;">Análise de movimentações confirmadas por mês</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                            <th style="padding: 15px; text-align: left; border: 1px solid #9b59b6;">Período</th>
                            <th style="padding: 15px; text-align: right; border: 1px solid #9b59b6;">Entradas</th>
                            <th style="padding: 15px; text-align: right; border: 1px solid #9b59b6;">Saídas</th>
                            <th style="padding: 15px; text-align: right; border: 1px solid #9b59b6;">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${comparativo.map(m => `
                            <tr>
                                <td style="padding: 12px; border: 1px solid #ecf0f1;"><strong>${m.mesAno.charAt(0).toUpperCase() + m.mesAno.slice(1)}</strong></td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1; text-align: right; color: #27ae60; font-weight: bold;">${this.formatarMoeda(m.entradas)}</td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1; text-align: right; color: #e74c3c; font-weight: bold;">${this.formatarMoeda(m.saidas)}</td>
                                <td style="padding: 12px; border: 1px solid #ecf0f1; text-align: right; font-weight: bold; color: ${m.saldo >= 0 ? '#27ae60' : '#e74c3c'};">${this.formatarMoeda(m.saldo)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #f8f9fa; font-weight: bold;">
                            <td style="padding: 15px; border: 1px solid #bdc3c7;">TOTAL GERAL</td>
                            <td style="padding: 15px; border: 1px solid #bdc3c7; text-align: right; color: #27ae60;">${this.formatarMoeda(comparativo.reduce((sum, m) => sum + m.entradas, 0))}</td>
                            <td style="padding: 15px; border: 1px solid #bdc3c7; text-align: right; color: #e74c3c;">${this.formatarMoeda(comparativo.reduce((sum, m) => sum + m.saidas, 0))}</td>
                            <td style="padding: 15px; border: 1px solid #bdc3c7; text-align: right; color: ${comparativo.reduce((sum, m) => sum + m.saldo, 0) >= 0 ? '#27ae60' : '#e74c3c'};">${this.formatarMoeda(comparativo.reduce((sum, m) => sum + m.saldo, 0))}</td>
                        </tr>
                    </tfoot>
                </table>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center; color: #7f8c8d; font-size: 12px;">
                    <p style="margin: 5px 0;">💻 Desenvolvido Por <strong>Future Tech Developer©</strong> 2025 Todos os direitos Reservados</p>
                    <p style="margin: 5px 0;"><strong>Future Tech Informatica</strong></p>
                </div>
            </div>
        `;
        
        document.getElementById('comparativoMensalImpressao').innerHTML = html;
        this.abrirModal('modalComparativoMensal');
    }
    
    fecharMesAtual() {
        const dataAtual = new Date();
        const mesAno = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}`;
        const nomeMes = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        const confirmacao = confirm(`🔒 Deseja fechar o mês de ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}?\n\nIsso criará um snapshot (foto) dos dados deste mês para consulta futura.\n\nOs lançamentos permanecerão no sistema.`);
        
        if (!confirmacao) return;
        
        const lancamentosMes = this.dados.lancamentos.filter(lanc => {
            const data = new Date(lanc.data + 'T00:00:00');
            const mesAnoLanc = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
            return mesAnoLanc === mesAno;
        });
        
        const confirmados = lancamentosMes.filter(l => l.status === 'Confirmado');
        const entradas = confirmados.filter(l => l.valor > 0).reduce((sum, l) => sum + l.valor, 0);
        const saidas = confirmados.filter(l => l.valor < 0).reduce((sum, l) => sum + Math.abs(l.valor), 0);
        const saldo = entradas - saidas;
        
        const fechamento = {
            mesAno: mesAno,
            nomeMes: nomeMes,
            dataFechamento: new Date().toISOString(),
            totalLancamentos: lancamentosMes.length,
            entradas: entradas,
            saidas: saidas,
            saldo: saldo,
            lancamentos: JSON.parse(JSON.stringify(lancamentosMes)) // Cópia profunda
        };
        
        if (!this.dados.fechamentosMensais) {
            this.dados.fechamentosMensais = [];
        }
        
        // Verificar se já existe fechamento para este mês
        const indexExistente = this.dados.fechamentosMensais.findIndex(f => f.mesAno === mesAno);
        if (indexExistente >= 0) {
            this.dados.fechamentosMensais[indexExistente] = fechamento;
        } else {
            this.dados.fechamentosMensais.push(fechamento);
        }
        
        this.salvarDados();
        this.popularFiltroMesAno();
        
        alert(`✅ Mês fechado com sucesso!\n\n📊 ${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}\n💰 Saldo: ${this.formatarMoeda(saldo)}\n📝 ${lancamentosMes.length} lançamentos salvos`);
    }

    atualizarSelectProdutos() {
        const select = document.getElementById('itemProduto');
        select.innerHTML = '<option value="">Selecione um produto</option>' +
            this.dados.produtos.map(p => `<option value="${p.id}">${p.descricao} - ${this.formatarMoeda(p.precoVenda || p.venda || 0)}</option>`).join('');
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
            <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                    <div style="flex: 1;">
                        ${config.logo ? `<img src="${config.logo}" alt="Logo" style="max-width: 120px; margin-bottom: 10px;">` : ''}
                        <h3 style="margin: 5px 0; color: #2c3e50;">${config.nome || 'Minha Empresa'}</h3>
                        <p style="margin: 3px 0; font-size: 13px;"><strong>CNPJ:</strong> ${config.cnpj || ''}</p>
                        <p style="margin: 3px 0; font-size: 13px;">${config.telefone || ''}</p>
                        <p style="margin: 3px 0; font-size: 13px;">${config.email || ''}</p>
                        <p style="margin: 3px 0; font-size: 13px;">${config.endereco || ''}</p>
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <h4 style="margin: 5px 0; color: #2c3e50;">Cliente</h4>
                        <p style="margin: 3px 0; font-size: 13px;"><strong>${cliente?.nome || 'Cliente não encontrado'}</strong></p>
                        <p style="margin: 3px 0; font-size: 13px;">${cliente?.documento || ''}</p>
                        <p style="margin: 3px 0; font-size: 13px;">${cliente?.telefone || ''}</p>
                        <p style="margin: 3px 0; font-size: 13px;">${cliente?.email || ''}</p>
                        <p style="margin: 3px 0; font-size: 13px;">${cliente?.endereco || ''}</p>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <h2 style="margin: 10px 0; color: #2c3e50;">ORÇAMENTO #${orc.numero}</h2>
                    <p style="margin: 5px 0; font-size: 14px;">Data: ${this.formatarData(orc.data)}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #2c3e50; color: white;">
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Produto/Serviço</th>
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: center; width: 80px;">Qtd</th>
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: right; width: 120px;">Valor Unit.</th>
                            <th style="padding: 12px; border: 1px solid #ddd; text-align: right; width: 120px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orc.itens.map((item, index) => `
                            <tr style="background-color: ${index % 2 === 0 ? '#f9f9f9' : 'white'};">
                                <td style="padding: 10px; border: 1px solid #ddd;">${item.produtoNome}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantidade}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">${this.formatarMoeda(item.preco)}</td>
                                <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${this.formatarMoeda(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #27ae60; color: white;">
                            <td colspan="3" style="padding: 15px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">TOTAL:</td>
                            <td style="padding: 15px; border: 1px solid #ddd; text-align: right; font-size: 18px; font-weight: bold;">${this.formatarMoeda(orc.total)}</td>
                        </tr>
                    </tfoot>
                </table>
                
                ${orc.observacoes ? `
                    <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
                        <strong style="color: #2c3e50;">Observações:</strong><br>
                        <span style="font-size: 13px;">${orc.observacoes}</span>
                    </div>
                ` : ''}
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span class="status-badge status-${orc.status.toLowerCase().replace(' ', '-')}">${orc.status}</span></p>
                </div>
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
        
        // Garantir que saldo inicial seja exibido após atualizar interface
        // Usar requestAnimationFrame + setTimeout para garantir que seja a última coisa
        requestAnimationFrame(() => {
            setTimeout(() => {
                const campoSaldo = document.getElementById('saldoInicial');
                if (campoSaldo && this.dados.saldoInicial !== undefined && this.dados.saldoInicial !== null) {
                    campoSaldo.value = this.dados.saldoInicial;
                    console.log('Saldo restaurado na interface:', this.dados.saldoInicial);
                }
            }, 300);
        });
    }
}

// Inicializar o sistema
const sistema = new SistemaGestao();
