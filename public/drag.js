function makeDraggable(elementId, handleId) {
    const element = document.getElementById(elementId);
    const handle = document.getElementById(handleId);
    const storageKey = `draggablePos_${elementId}`;

    if (!element || !handle) {
        console.warn(`Elemento principal (${elementId}) ou alça de arraste (${handleId}) não encontrado.`);
        return;
    }

    let offsetX, offsetY;
    let isDragging = false;

    // 1. CARREGAR POSIÇÃO SALVA
    const savedPos = localStorage.getItem(storageKey);
    if (savedPos) {
        const { top, left } = JSON.parse(savedPos);
        element.style.top = `${top}px`;
        element.style.left = `${left}px`;
        element.style.transform = 'none';
    }

    // Define a posição base
    element.style.position = 'fixed';
    element.style.zIndex = '1050';
    element.style.cursor = 'grab';

    // 🎯 Adicionar listeners de Mouse e Touch
    handle.addEventListener('mousedown', startDrag);
    handle.addEventListener('touchstart', startDrag);

    function startDrag(e) {
        // Usa o primeiro toque se for um evento touch
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        isDragging = true;
        e.preventDefault();

        // 2. CORREÇÃO DO SALTO/TRANSFORM NO INÍCIO DO ARRASTE
        if (window.getComputedStyle(element).transform !== 'none') {
            const currentLeft = element.getBoundingClientRect().left;
            const currentTop = element.getBoundingClientRect().top;

            element.style.transform = 'none';
            element.style.left = `${currentLeft}px`;
            element.style.top = `${currentTop}px`;
        }

        // Calcula o deslocamento do clique/toque dentro do elemento
        const rect = element.getBoundingClientRect();
        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;

        element.style.userSelect = 'none';

        // Adiciona listeners globais dependendo do tipo de evento
        if (e.type.includes('touch')) {
            document.addEventListener('touchmove', onMove);
            document.addEventListener('touchend', onEnd);
        } else {
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
        }
    }

    function onMove(e) {
        if (!isDragging) return;

        // Usa o primeiro toque se for um evento touch
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        let newX = clientX - offsetX;
        let newY = clientY - offsetY;

        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
    }

    function onEnd() {
        if (!isDragging) return;

        isDragging = false;
        element.style.cursor = 'grab';
        element.style.userSelect = '';

        // 3. SALVAR POSIÇÃO FINAL NO LOCALSTORAGE
        const finalPosition = {
            top: element.getBoundingClientRect().top,
            left: element.getBoundingClientRect().left
        };
        localStorage.setItem(storageKey, JSON.stringify(finalPosition));

        // Remove listeners
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
    }
}