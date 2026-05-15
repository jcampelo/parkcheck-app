const QRCode = require('qrcode');
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const qrDataUrl = await QRCode.toDataURL('https://park-check.vercel.app/cliente.html', {
    width: 300, margin: 1, color: { dark: '#4361ee', light: '#ffffff' }
  });

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',-apple-system,sans-serif; color:#1a1a2e; background:#fff; font-size:14px; line-height:1.6; }
  .page { max-width:720px; margin:0 auto; padding:48px; }

  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:36px; padding-bottom:28px; border-bottom:2px solid #4361ee; }
  .logo { font-size:24px; font-weight:700; letter-spacing:-0.03em; }
  .logo span { color:#4361ee; }
  .logo .sub { font-size:13px; font-weight:500; color:#888; letter-spacing:0; margin-left:4px; }
  .header-meta { text-align:right; font-size:12px; color:#666; line-height:1.8; }
  .header-meta strong { color:#1a1a2e; font-weight:600; }

  .hero { background:linear-gradient(135deg,#4361ee 0%,#3a0ca3 100%); border-radius:16px; padding:32px 40px; margin-bottom:36px; color:#fff; }
  .hero h1 { font-size:24px; font-weight:700; letter-spacing:-0.02em; margin-bottom:8px; }
  .hero p { font-size:14px; opacity:.88; line-height:1.65; }

  h2 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#4361ee; margin-bottom:16px; margin-top:32px; display:flex; align-items:center; gap:8px; }
  h2::after { content:''; flex:1; height:1px; background:#e8eaf6; }

  .role-badge { display:inline-block; font-size:11px; font-weight:700; padding:4px 14px; border-radius:99px; text-transform:uppercase; letter-spacing:.06em; margin-bottom:18px; }
  .badge-green { background:#2dc653; color:#fff; }
  .badge-blue { background:#4361ee; color:#fff; }

  .qr-section { display:flex; gap:28px; align-items:center; background:#f8f9ff; border:1px solid #e8eaf6; border-radius:14px; padding:24px 28px; margin-bottom:12px; }
  .qr-section img { width:120px; height:120px; flex-shrink:0; border-radius:8px; }
  .qr-text h3 { font-size:15px; font-weight:700; color:#1a1a2e; margin-bottom:6px; }
  .qr-text p { font-size:13px; color:#555; line-height:1.55; }
  .qr-url { font-size:11px; color:#4361ee; margin-top:8px; font-weight:500; }

  .step { display:flex; gap:14px; margin-bottom:14px; align-items:flex-start; }
  .step-num { width:30px; height:30px; border-radius:50%; background:#4361ee; color:#fff; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
  .step-num.green { background:#2dc653; }
  .step-title { font-weight:600; font-size:14px; color:#1a1a2e; margin-bottom:3px; }
  .step-desc { font-size:13px; color:#555; line-height:1.55; }
  .step-tip { display:inline-block; margin-top:6px; background:#f8f9ff; border:1px solid #e8eaf6; border-radius:6px; padding:5px 10px; font-size:12px; color:#4361ee; font-weight:500; }

  .tip-box { background:#fff8e6; border:1px solid #ffd166; border-radius:10px; padding:11px 16px; margin-bottom:16px; font-size:13px; color:#7a5c00; }
  .tip-box strong { color:#5a4200; }

  .divider { height:1px; background:#e8eaf6; margin:32px 0; }

  .summary-box { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:4px; }
  .summary-card { background:#f8f9ff; border:1px solid #e8eaf6; border-radius:10px; padding:13px 15px; }
  .summary-card .s-label { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; font-weight:600; }
  .summary-card .s-value { font-size:13px; font-weight:500; color:#1a1a2e; line-height:1.4; }

  .footer { margin-top:36px; padding-top:20px; border-top:1px solid #e8eaf6; display:flex; justify-content:space-between; align-items:flex-end; font-size:12px; color:#888; }
  .footer strong { display:block; color:#1a1a2e; font-size:13px; font-weight:600; margin-bottom:3px; }

  .voucher-mock { border:1px solid #ddd; border-radius:10px; overflow:hidden; max-width:460px; margin:14px 0 4px; box-shadow:0 2px 10px rgba(0,0,0,0.10); break-inside:avoid; }
  .vm-header { background:linear-gradient(90deg,#1a6ff5,#3b82f6); color:#fff; font-size:17px; font-weight:700; padding:14px 20px; }
  .vm-body { padding:16px 20px; background:#fff; }
  .vm-subtitle { font-size:11px; font-weight:600; color:#1a1a2e; margin-bottom:4px; text-transform:uppercase; letter-spacing:.04em; }
  .vm-plate { font-size:34px; font-weight:700; letter-spacing:0.08em; color:#1a1a2e; margin-bottom:10px; }
  .vm-divider { border:none; border-top:1px solid #e5e7eb; margin:10px 0; }
  .vm-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
  .vm-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
  .vm-fl { font-size:10px; color:#6b7280; margin-bottom:2px; }
  .vm-fv { font-size:12px; font-weight:500; color:#1a1a2e; }
  .vm-footer { font-size:9px; color:#d1d5db; margin-top:12px; line-height:1.4; }

  /* page break control */
  .hero, .qr-section, .tip-box, .step, .summary-box, .footer,
  .role-badge, .summary-card { break-inside: avoid; }
  h2 { break-after: avoid; }
  .divider { break-after: avoid; }
  .badge-blue { break-before: page; }
  .summary-box { break-before: avoid; }
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="logo">Park<span>Check</span><span class="sub">· Manual do Usuário</span></div>
    <div class="header-meta">
      <strong>AtivaSys Sistemas</strong><br>
      Jefferson Campelo · Analista de Sistemas<br>
      (92) 99135-8237 · WhatsApp
    </div>
  </div>

  <div class="hero">
    <h1>Como usar o ParkCheck</h1>
    <p>Este manual explica passo a passo como funciona o sistema — tanto para quem está chegando ao estacionamento quanto para quem está gerenciando o negócio. Sem complicação.</p>
  </div>

  <!-- ===================== CLIENTE ===================== -->
  <div class="role-badge badge-green">Para o Cliente</div>

  <h2>Como fazer o check-in (registrar a entrada)</h2>

  <div class="qr-section">
    <img src="${qrDataUrl}" alt="QR Code ParkCheck">
    <div class="qr-text">
      <h3>Passo 1 — Aponte a câmera para este QR Code</h3>
      <p>Ao chegar no estacionamento, abra a câmera do seu celular e aponte para este código. Não precisa baixar nenhum aplicativo — o sistema abre direto no navegador.</p>
      <div class="qr-url">https://park-check.vercel.app/cliente.html</div>
    </div>
  </div>

  <div class="tip-box">
    <strong>Como funciona na maioria dos celulares:</strong> abra a câmera normalmente, aponte para o QR Code e aguarde um link aparecer na tela. Toque nele e a tela do ParkCheck abrirá automaticamente.
  </div>

  <div class="step">
    <div class="step-num green">2</div>
    <div>
      <div class="step-title">Preencha os seus dados</div>
      <div class="step-desc">Uma tela simples vai aparecer pedindo: <strong>placa do veículo</strong>, <strong>seu nome</strong> e (opcional) <strong>telefone para contato</strong>. Preencha e toque no botão <strong>Fazer Check-in</strong>.</div>
    </div>
  </div>

  <div class="step">
    <div class="step-num green">3</div>
    <div>
      <div class="step-title">Pronto! Sua entrada está registrada</div>
      <div class="step-desc">O sistema anota o horário exato da sua entrada. Quando você for sair, o atendente já saberá o tempo que seu veículo ficou e o valor a pagar — sem precisar de nada mais da sua parte.</div>
    </div>
  </div>

  <div class="step">
    <div class="step-num green">4</div>
    <div>
      <div class="step-title">Comprovante de entrada salvo automaticamente</div>
      <div class="step-desc">Assim que o check-in é confirmado, o sistema baixa automaticamente uma <strong>imagem de comprovante</strong> no seu celular — sem precisar tocar em nada. Guarde a imagem e apresente ao atendente na saída. Veja como o comprovante aparece:</div>
      <div class="voucher-mock">
        <div class="vm-header">ParkCheck</div>
        <div class="vm-body">
          <div class="vm-subtitle">Comprovante de Entrada</div>
          <div class="vm-plate">ABC1D23</div>
          <div class="vm-divider"></div>
          <div class="vm-grid">
            <div><div class="vm-fl">Cliente</div><div class="vm-fv">João Silva</div></div>
            <div><div class="vm-fl">Telefone</div><div class="vm-fv">(92) 99999-1234</div></div>
            <div><div class="vm-fl">Data</div><div class="vm-fv">14/05/2026</div></div>
          </div>
          <div class="vm-grid2">
            <div><div class="vm-fl">Horário de entrada</div><div class="vm-fv">09:35</div></div>
            <div><div class="vm-fl">Código</div><div class="vm-fv">a1b2-c3d4…</div></div>
          </div>
          <div class="vm-footer">Guarde este comprovante. Apresente no caixa para liberação do veículo.</div>
        </div>
      </div>
      <span class="step-tip">Caso o download não abra automaticamente, toque em "Baixar comprovante" na tela de confirmação.</span>
    </div>
  </div>

  <div class="divider"></div>

  <!-- ===================== GERENTE ===================== -->
  <div class="role-badge badge-blue">Para o Gerente</div>

  <h2>Acessando o sistema</h2>

  <div class="step">
    <div class="step-num">1</div>
    <div>
      <div class="step-title">Abra o ParkCheck no seu celular ou computador</div>
      <div class="step-desc">Digite o endereço do sistema no navegador (Chrome, Safari ou qualquer outro). Não precisa instalar nada. Faça login com seu e-mail e senha cadastrados.</div>
      <span class="step-tip">Dica: adicione a página aos favoritos para abrir mais rápido no dia a dia.</span>
    </div>
  </div>

  <h2>Gerenciando o pátio — aba "Pátio"</h2>

  <div class="step">
    <div class="step-num">2</div>
    <div>
      <div class="step-title">Veja todos os veículos que estão no pátio agora</div>
      <div class="step-desc">A tela inicial mostra a lista de todos os carros estacionados. Para cada veículo você vê: a placa, o nome do cliente, quanto tempo já passou e o valor que está acumulando.</div>
    </div>
  </div>

  <div class="step">
    <div class="step-num">3</div>
    <div>
      <div class="step-title">Quando o cliente for sair: toque em "Check-out"</div>
      <div class="step-desc">Localize o veículo na lista e toque no botão <strong>Check-out</strong>. Uma tela mostrará o resumo completo: entrada, saída, tempo total e o <strong>valor exato a cobrar</strong>. Confirme e a saída é registrada automaticamente.</div>
      <span class="step-tip">O valor é calculado sozinho — você não precisa fazer nenhuma conta.</span>
    </div>
  </div>

  <h2>Consultando saídas — aba "Histórico"</h2>

  <div class="step">
    <div class="step-num">4</div>
    <div>
      <div class="step-title">Veja o registro de todos os atendimentos finalizados</div>
      <div class="step-desc">Na aba <strong>Histórico</strong> ficam todos os check-outs realizados, com placa, horário e valor cobrado. Use para conferir qualquer atendimento do dia.</div>
    </div>
  </div>

  <h2>Acompanhando o faturamento — aba "Ganhos"</h2>

  <div class="step">
    <div class="step-num">5</div>
    <div>
      <div class="step-title">Veja quanto entrou hoje</div>
      <div class="step-desc">Na aba <strong>Ganhos</strong> o total do dia aparece em destaque no topo — atualizado a cada check-out realizado.</div>
    </div>
  </div>

  <div class="step">
    <div class="step-num">6</div>
    <div>
      <div class="step-title">Consulte a semana ou o mês inteiro</div>
      <div class="step-desc">Toque em <strong>Esta semana</strong> ou <strong>Este mês</strong> para ver um resumo dia a dia do faturamento. Cada linha mostra o total e a quantidade de saídas daquele dia.</div>
    </div>
  </div>

  <h2>Ajustando os preços — aba "Config"</h2>

  <div class="step">
    <div class="step-num">7</div>
    <div>
      <div class="step-title">Defina quanto vai cobrar por hora</div>
      <div class="step-desc">Na aba <strong>Config</strong> você coloca o valor da 1ª hora e o valor de cada hora extra. O sistema mostra exemplos automáticos com os preços que você definir. Quando estiver certo, toque em <strong>Salvar configurações</strong>.</div>
    </div>
  </div>

  <h2>Excluindo registros indesejados</h2>

  <div class="step">
    <div class="step-num">8</div>
    <div>
      <div class="step-title">Excluir um registro individual</div>
      <div class="step-desc">Nas abas <strong>Pátio</strong> e <strong>Histórico</strong>, cada veículo tem um <strong>ícone de lixeira</strong> ao lado do botão de ação. Toque nele para excluir aquele registro específico. O sistema pede confirmação antes de apagar — sem risco de exclusão acidental.</div>
      <span class="step-tip">Use para remover check-ins de teste ou registros inseridos por engano.</span>
    </div>
  </div>

  <div class="step">
    <div class="step-num">9</div>
    <div>
      <div class="step-title">Apagar todos os dados de uma vez (Zona de Perigo)</div>
      <div class="step-desc">Na aba <strong>Config</strong>, role até o final da tela para encontrar a <strong>Zona de Perigo</strong> (fundo vermelho). Toque em <strong>Apagar todos os dados</strong> para limpar todo o histórico e pátio de uma só vez. O sistema exibe um aviso de confirmação com destaque vermelho antes de executar.</div>
      <span class="step-tip">Use somente para zerar os dados de teste antes de entregar o sistema ao cliente. Esta ação não pode ser desfeita.</span>
    </div>
  </div>

  <div class="divider"></div>

  <h2>Resumo rápido</h2>
  <div class="summary-box">
    <div class="summary-card">
      <div class="s-label">Cliente chega</div>
      <div class="s-value">QR Code → Preenche dados → Comprovante salvo</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Cliente sai</div>
      <div class="s-value">Toca em Check-out → Confirma → Cobra o valor</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Conferir ganhos</div>
      <div class="s-value">Aba Ganhos → Dia, semana ou mês</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Mudar preços</div>
      <div class="s-value">Aba Config → Atualiza → Salva</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Excluir registro</div>
      <div class="s-value">Ícone lixeira no card → Confirma</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Limpar tudo</div>
      <div class="s-value">Config → Zona de Perigo → Confirma</div>
    </div>
  </div>

  <div class="footer">
    <div>
      <strong>AtivaSys Sistemas · Jefferson Campelo</strong>
      Analista de Sistemas · (92) 99135-8237 · WhatsApp
    </div>
    <div>Dúvidas? Chame no WhatsApp.</div>
  </div>

</div>
</body>
</html>`;

  fs.writeFileSync(path.resolve(__dirname, 'manual.html'), html);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const htmlPath = 'file://' + path.resolve(__dirname, 'manual.html').replace(/\\/g, '/');
  await page.goto(htmlPath, { waitUntil: 'networkidle' });

  const outputPath = path.resolve(__dirname, 'ParkCheck-Manual-do-Usuario.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', right: '0', bottom: '18mm', left: '0' },
  });

  await browser.close();
  console.log('PDF gerado: ' + outputPath);
})();
