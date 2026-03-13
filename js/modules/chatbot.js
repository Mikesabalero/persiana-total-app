// ============================================================
// chatbot.js — Chatbot de carga de clientes
// ============================================================

import { DATA, CLIENT_MAP } from '../core/state.js';
import { TBL } from '../core/config.js';
import { apiGet, apiGetAll, apiPost } from '../core/api.js';

let chatSessionId = null;
let chatState = { data: {}, props: [] };

export function openChatbot() {
    chatSessionId = 'session_' + Date.now();
    document.getElementById('modal-chatbot').style.display = 'flex';
    document.getElementById('chat-messages').innerHTML = '';
    showChatInput();
    appendChatMessage('bot', '¡Hola! Soy el asistente de Persiana Total. Decime, ¿qué cliente o propiedad querés cargar?');
}

export function closeChatbot() {
    document.getElementById('modal-chatbot').style.display = 'none';
    document.getElementById('chat-messages').innerHTML = '';
    chatSessionId = null;
}

export function appendChatMessage(sender, text) {
    let msgDiv = document.createElement('div');
    msgDiv.style.maxWidth = '85%';
    msgDiv.style.padding = '10px 14px';
    msgDiv.style.borderRadius = '12px';
    msgDiv.style.fontSize = '14px';
    msgDiv.style.lineHeight = '1.4';

    if (sender === 'bot') {
        msgDiv.style.alignSelf = 'flex-start';
        msgDiv.style.background = '#f3f4f6';
        msgDiv.style.color = '#1f2937';
        msgDiv.style.borderTopLeftRadius = '4px';

        let htmlText = text.replace(/\\n/g, '<br>').replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        msgDiv.innerHTML = htmlText;
    } else {
        msgDiv.style.alignSelf = 'flex-end';
        msgDiv.style.background = 'var(--grad1)';
        msgDiv.style.color = 'white';
        msgDiv.style.borderTopRightRadius = '4px';
        msgDiv.innerText = text;
    }

    let msgs = document.getElementById('chat-messages');
    msgs.appendChild(msgDiv);
    setTimeout(() => msgs.scrollTop = msgs.scrollHeight, 50);
    return msgDiv;
}

export function showChatInput() {
    document.getElementById('chat-input-area').style.display = 'flex';
    let optsArea = document.getElementById('chat-options-area');
    if (optsArea) optsArea.style.display = 'none';
    let input = document.getElementById('chat-input');
    input.value = '';
    setTimeout(() => input.focus(), 100);
}

export function showChatOptions(opts) {
    let optsArea = document.getElementById('chat-options-area');
    if (!optsArea) return;
    document.getElementById('chat-input-area').style.display = 'none';
    optsArea.style.display = 'flex';
    optsArea.innerHTML = '';
    opts.forEach(o => {
        let btn = document.createElement('button');
        btn.className = 'btn btn-sm';
        btn.style.cssText = 'margin:4px;';
        btn.innerHTML = o.label;
        btn.onclick = () => {
            if (o.value === 'cerrar') { closeChatbot(); return; }
            if (o.value === 'presupuesto' && chatState.nId) {
                closeChatbot();
                if (window.openNewPres) window.openNewPres();
                return;
            }
        };
        optsArea.appendChild(btn);
    });
}

export async function submitChatInput() {
    let input = document.getElementById('chat-input');
    let text = input.value;
    if (!text.trim()) return;

    input.value = '';
    appendChatMessage('user', text);

    let typingDiv = appendChatMessage('bot', 'Escribiendo...');

    try {
        let res = await fetch('https://n8n.srv1323649.hstgr.cloud/webhook/chat-app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, sessionId: chatSessionId })
        });

        if (typingDiv && typingDiv.parentNode) {
            typingDiv.parentNode.removeChild(typingDiv);
        }

        if (res.ok) {
            let data = await res.json();
            if (data && data.response) {
                appendChatMessage('bot', data.response);
            } else {
                appendChatMessage('bot', 'Error: Respuesta inesperada del agente.\n' + JSON.stringify(data));
            }
        } else {
            appendChatMessage('bot', 'Error al procesar el mensaje del agente.');
        }
    } catch (e) {
        console.error(e);
        if (typingDiv && typingDiv.parentNode) {
            typingDiv.parentNode.removeChild(typingDiv);
        }
        appendChatMessage('bot', 'Error de conexión con el servidor.');
    }
}

export async function _saveChatbotData() {
    showChatOptions([]);
    appendChatMessage('bot', '⏳ Guardando...');
    try {
        let nClient = await apiPost(TBL.clientes, chatState.data);
        let nId = nClient && (nClient.Id || nClient.id || (Array.isArray(nClient) && nClient[0] && (nClient[0].Id || nClient[0].id)));

        if (nId) {
            chatState.nId = nId;
            CLIENT_MAP[nId] = { Nombre: chatState.data.Nombre, Telefono: chatState.data.Telefono };
            for (let i = 0; i < chatState.props.length; i++) {
                let p = Object.assign({}, chatState.props[i]);
                p.Clientes_id = parseInt(nId);
                if (p.Zona_id) p.Zona_id = parseInt(p.Zona_id);
                delete p.Principal;
                p.Principal = chatState.props[i].Principal ? true : false;
                let cProp = await apiPost(TBL.propiedades, p);

                let pObj = Array.isArray(cProp) ? cProp[0] : (cProp || p);
                if (!pObj.Clientes) pObj.Clientes = [{ Id: parseInt(nId) }];
                DATA.propiedades.push(pObj);
            }

            if (DATA._loaded.clientes) { DATA.clientes = await apiGet(TBL.clientes); if (window.renderClientes) window.renderClientes(); }
            if (DATA._loaded.propiedades) { DATA.propiedades = await apiGetAll(TBL.propiedades); if (window.renderPropiedades) window.renderPropiedades(); }

            appendChatMessage('bot', `¡Listo! <b>${chatState.data.Nombre}</b> fue cargado con ${chatState.props.length} propiedade(s). Ya podés hacerle un presupuesto.`);
            showChatOptions([
                { label: '📋 Hacer presupuesto', value: 'presupuesto' },
                { label: '❌ Cerrar', value: 'cerrar' }
            ]);
        } else {
            appendChatMessage('bot', '❌ Error: No se pudo obtener el ID del cliente generado.');
            showChatInput();
        }
    } catch (e) {
        console.error(e);
        appendChatMessage('bot', '❌ Ocurrió un error al intentar guardar los datos.');
        showChatInput();
    }
}
