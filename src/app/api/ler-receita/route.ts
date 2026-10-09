import { NextRequest, NextResponse } from 'next/server';

interface GrauOlho {
  esferico?: string;
  cilindrico?: string;
  eixo?: string;
  dp?: string;
  altura?: string;
  adicao?: string;
}

interface DadosReceitaExtraidos {
  sucesso: boolean;
  cliente_nome?: string;
  cliente_telefone?: string;
  medico_ou_otica?: string;
  numero_pedido?: string;
  data_receita?: string;
  data_entrega?: string;
  categoria?: string;
  tipo_lente?: string;
  tratamento?: string;
  armacao?: string;
  valor?: string;
  pagamento?: string;
  grau?: {
    od?: GrauOlho;
    oe?: GrauOlho;
    adicao_geral?: string;
    dnp_geral?: string;
  };
  resumo_formatado?: string;
  observacoes_extras?: string;
  erro?: string;
  mensagem?: string;
}

const PROMPT_INSTRUCAO = `
Você é um especialista em transcrição e leitura de prescrições ópticas, ordens de serviço de ótica, receitas médicas oftalmológicas e pedidos de laboratório de lentes.
Analise a imagem ou documento fornecido com extrema atenção e extraia todos os dados com máxima fidelidade.

Diretrizes para o grau:
- OD = Olho Direito
- OE = Olho Esquerdo
- ESF = Grau Esférico (ex: "-", "0.00", "Plano", "-0.25", "+1.50")
- CIL / CILÍNDRICO = Grau Cilíndrico (ex: "-1.00", "-0.75")
- EIXO = Eixo em graus (ex: "5", "5°", "180", "90")
- D.P. / DNP = Distância Pupilar / Distância Naso-Pupilar (ex: "31", "62")
- ALT = Altura
- ADIC / ADIÇÃO = Adição para perto
- Lentes: Identifique se é Monofocal, Multifocal, Bifocal, Visão Simples, etc.
- Tratamento: Ex: Blue Filter, Antirreflexo, Fotossensível, Crizal, etc.
- Armação: Nome/modelo da armação se houver.
- Cliente / Paciente: Nome da pessoa.
- Telefone: Telefone ou WhatsApp do cliente.
- Pedido / Médico / Ótica: Número do pedido ou nome da ótica / médico.
- Valor / Pagamento: Preço total e detalhes de pagamento se constarem no comprovante.

Retorne EXCLUSIVAMENTE um JSON com este formato exato:
{
  "sucesso": true,
  "cliente_nome": "Nome completo",
  "cliente_telefone": "Telefone ou WhatsApp",
  "medico_ou_otica": "Nome da ótica, laboratório ou médico e número do pedido",
  "numero_pedido": "9138",
  "data_receita": "28/09/2026",
  "data_entrega": "29/09/2026 a 30/09/2026",
  "categoria": "Óculos de Grau",
  "tipo_lente": "MONOFOCAL",
  "tratamento": "BLUE FILTER",
  "armacao": "OVAL MIU MIU",
  "valor": "220,00",
  "pagamento": "PIX CPF: 700724061-51",
  "grau": {
    "od": {
      "esferico": "-",
      "cilindrico": "-1,00",
      "eixo": "5",
      "dp": "",
      "altura": "",
      "adicao": ""
    },
    "oe": {
      "esferico": "-0,25",
      "cilindrico": "-0,75",
      "eixo": "5",
      "dp": "",
      "altura": "",
      "adicao": ""
    },
    "adicao_geral": "",
    "dnp_geral": ""
  },
  "resumo_formatado": "OD: Esf - | Cil -1,00 | Eixo 5° | OE: Esf -0,25 | Cil -0,75 | Eixo 5° | Armação: OVAL MIU MIU | Lentes: MONOFOCAL (BLUE FILTER)",
  "observacoes_extras": "Notas adicionais de pagamento ou observações"
}
`;

function extrairJson(text: string): any {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const slice = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(slice);
    }
    throw new Error('Não foi possível interpretar a resposta JSON da IA.');
  }
}

async function chamarGemini(apiKey: string, base64Data: string, mimeType: string): Promise<DadosReceitaExtraidos> {
  const models = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
  let lastError = '';

  // 1. Tentar primeiro via Interactions API (recomendado oficial pelo Google Gemini)
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${apiKey}`;
      const payload = {
        model,
        input: [
          {
            type: 'text',
            text: PROMPT_INSTRUCAO,
          },
          {
            type: 'image',
            data: base64Data,
            mime_type: mimeType || 'image/jpeg',
          },
        ],
        response_format: {
          type: 'text',
          mime_type: 'application/json',
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          'Api-Revision': '2026-05-20',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resData = await response.json();
        let text = '';

        if (Array.isArray(resData?.steps)) {
          for (const step of resData.steps) {
            if (step.type === 'model_output' && Array.isArray(step.content)) {
              for (const item of step.content) {
                if (item.type === 'text' && item.text) {
                  text += item.text;
                }
              }
            }
          }
        }

        if (!text && typeof resData?.output_text === 'string') {
          text = resData.output_text;
        }

        if (text) {
          const parsed = extrairJson(text);
          parsed.sucesso = true;
          return parsed;
        }
      } else {
        const errorText = await response.text();
        lastError = `Interactions API (${model}): status ${response.status} - ${errorText}`;
        console.warn(`[API Leitura Receita] Falha no modelo ${model} (Interactions):`, errorText);
      }
    } catch (err: any) {
      lastError = `Interactions (${model}): ${err?.message || String(err)}`;
      console.warn(`[API Leitura Receita] Erro Interactions ${model}:`, err);
    }
  }

  // 2. Fallback: tentar endpoint generateContent com os modelos atuais
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: PROMPT_INSTRUCAO },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resData = await response.json();
        const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = extrairJson(text);
          parsed.sucesso = true;
          return parsed;
        }
      } else {
        const errorText = await response.text();
        lastError = `generateContent (${model}): status ${response.status} - ${errorText}`;
        console.warn(`[API Leitura Receita] Falha no modelo ${model} (generateContent):`, errorText);
      }
    } catch (err: any) {
      lastError = `generateContent (${model}): ${err?.message || String(err)}`;
      console.warn(`[API Leitura Receita] Erro generateContent ${model}:`, err);
    }
  }

  throw new Error(`Não foi possível processar a imagem com a IA: ${lastError}`);
}

export async function POST(req: NextRequest) {
  try {
    const customKey = req.headers.get('x-gemini-api-key') || '';
    const apiKey = (process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || customKey).trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'CHAVE_NAO_CONFIGURADA',
          mensagem:
            'Chave da API do Google Gemini não encontrada. Adicione GEMINI_API_KEY no arquivo .env.local ou informe sua chave nas configurações da página.',
        },
        { status: 400 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { sucesso: false, erro: 'ARQUIVO_AUSENTE', mensagem: 'Nenhum arquivo enviado.' },
          { status: 400 }
        );
      }
      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
    } else {
      const body = await req.json();
      base64Data = body.base64 || '';
      mimeType = body.mimeType || 'image/jpeg';

      // Se veio no formato data:image/png;base64,xxxx
      if (base64Data.includes(',')) {
        const parts = base64Data.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1];
        base64Data = parts[1];
      }
    }

    if (!base64Data) {
      return NextResponse.json(
        { sucesso: false, erro: 'ARQUIVO_VAZIO', mensagem: 'Conteúdo do arquivo não recebido.' },
        { status: 400 }
      );
    }

    const resultado = await chamarGemini(apiKey, base64Data, mimeType);
    return NextResponse.json(resultado);
  } catch (err: any) {
    console.error('[API Leitura Receita] Erro:', err);
    return NextResponse.json(
      {
        sucesso: false,
        erro: 'ERRO_PROCESSAMENTO',
        mensagem: err?.message || 'Erro interno ao processar leitura da receita.',
      },
      { status: 500 }
    );
  }
}
