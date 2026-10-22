import { ICON_MAX_BYTES, ICON_MIN_PIXELS } from '../../../domain/models/client-icon';
import {
  controlsOf,
  DESDE,
  dropOf,
  fileInput,
  iconField,
  leave,
  NOMBRE,
  pngFile,
  RejectingEditor,
  renderAdmin,
  rowsOf,
  SITIO,
  typeInto,
} from './admin.testing';

describe('AdminComponent', () => {
  /*
   * El panel tenía dos `@for` anidados y usaba `$index` adentro del segundo,
   * donde ya no es el de la fila sino el del campo. Cada valor terminaba
   * escrito en el ítem cuya posición coincidía con la del campo. Los dos tests
   * que siguen eligen a propósito un campo cuya posición no es la de su fila:
   * con el índice pisado, lo escrito aterriza en la otra.
   */
  it('escribe en la fila que se está editando y no en otra', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    typeInto(controlsOf(rowsOf(fixture)[0])[DESDE], '2030');
    await fixture.whenStable();

    expect(component.items()[0]['since']).toBe(2030);
    expect(component.items()[1]['since']).toBe(2023);
  });

  it('escribe el primer campo de la segunda fila en la segunda fila', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    typeInto(controlsOf(rowsOf(fixture)[1])[NOMBRE], 'Segunda editada');
    await fixture.whenStable();

    expect(component.items()[1]['name']).toBe('Segunda editada');
    expect(component.items()[0]['name']).toBe('Primera');
  });

  it('le da un id propio a cada control, sin repetir entre filas', async () => {
    const fixture = await renderAdmin();
    const host = fixture.nativeElement as HTMLElement;
    const ids = Array.from(host.querySelectorAll<HTMLElement>('.field input, .field textarea')).map(
      (control) => control.id,
    );

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('apunta cada etiqueta al control de su propia fila', async () => {
    const fixture = await renderAdmin();
    const row = rowsOf(fixture)[1];
    const label = row.querySelector<HTMLLabelElement>('.field label');
    const control = controlsOf(row)[NOMBRE];

    expect(label?.getAttribute('for')).toBe(control.id);
  });

  it('no ofrece editar el identificador, que es llave interna y no contenido', async () => {
    const fixture = await renderAdmin();
    const host = fixture.nativeElement as HTMLElement;
    const labels = Array.from(host.querySelectorAll('.field label')).map((label) =>
      label.textContent?.trim(),
    );

    expect(labels.some((label) => label?.startsWith('Identificador'))).toBeFalse();
  });

  it('le pone un identificador a la fila nueva sin preguntar', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    component.add();
    await fixture.whenStable();

    expect(component.items().at(-1)?.id).toMatch(/^[a-z0-9][a-z0-9-]{0,59}$/);
  });

  it('deja abierta sólo la fila nueva al agregar', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    component.toggle(0);
    await fixture.whenStable();
    expect(component.isExpanded(0)).toBeTrue();

    component.add();
    await fixture.whenStable();

    expect(component.isExpanded(0)).toBeFalse();
    expect(component.isExpanded(component.items().length - 1)).toBeTrue();
  });

  it('no marca nada mientras no se haya intentado publicar', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    component.add();
    await fixture.whenStable();
    const newRow = rowsOf(fixture).at(-1) as HTMLElement;

    expect(newRow.querySelector('.invalid')).toBeNull();
    expect(newRow.querySelector('.field-issue')).toBeNull();
    expect(newRow.querySelector('.row-issue')).toBeNull();
  });

  it('marca en rojo el campo que falta cuando el servidor rechaza', async () => {
    const fixture = await renderAdmin({ editor: new RejectingEditor() });
    const component = fixture.componentInstance;

    component.add();
    await fixture.whenStable();
    await component.save();
    await fixture.whenStable();

    const newRow = rowsOf(fixture).at(-1) as HTMLElement;
    const controls = controlsOf(newRow);

    // El nombre quedó vacío: es lo que frena la publicación.
    expect(controls[NOMBRE].classList).toContain('invalid');
    expect(controls[NOMBRE].getAttribute('aria-invalid')).toBe('true');
    // El año viene puesto con el actual: no se marca.
    expect(controls[DESDE].classList).not.toContain('invalid');
    expect(newRow.querySelector('.row-issue')).not.toBeNull();
  });

  /*
   * El sitio escrito a secas —"tomasssale.com"— hacía fallar la publicación
   * entera: el servidor parsea la URL y sin esquema tira. El panel lo pintaba
   * de rojo sin decir por qué, y el campo se veía completo.
   */
  it('le completa el https:// al sitio escrito a secas, al salir del campo', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;
    const website = controlsOf(rowsOf(fixture)[0])[SITIO];

    typeInto(website, 'tomasssale.com');
    await fixture.whenStable();
    leave(website);
    await fixture.whenStable();

    expect(component.items()[0]['website']).toBe('https://tomasssale.com');
  });

  it('no toca el sitio que ya traía su esquema', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;
    const website = controlsOf(rowsOf(fixture)[0])[SITIO];

    typeInto(website, 'http://tomasssale.com');
    await fixture.whenStable();
    leave(website);
    await fixture.whenStable();

    expect(component.items()[0]['website']).toBe('http://tomasssale.com');
  });

  it('dice qué le falta al campo, no sólo que algo falta', async () => {
    const fixture = await renderAdmin({ editor: new RejectingEditor() });
    const component = fixture.componentInstance;

    component.add();
    await fixture.whenStable();
    await component.save();
    await fixture.whenStable();

    const newRow = rowsOf(fixture).at(-1) as HTMLElement;
    const messages = Array.from(newRow.querySelectorAll('.field-issue')).map((node) =>
      node.textContent?.trim(),
    );

    expect(messages).toContain('Completá este campo');
  });

  it('ata el aviso al control para que lo anuncie el lector de pantalla', async () => {
    const fixture = await renderAdmin({ editor: new RejectingEditor() });
    const component = fixture.componentInstance;

    component.add();
    await fixture.whenStable();
    await component.save();
    await fixture.whenStable();

    const newRow = rowsOf(fixture).at(-1) as HTMLElement;
    const describedBy = controlsOf(newRow)[NOMBRE].getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();
    expect(newRow.querySelector(`#${describedBy}`)).not.toBeNull();
  });

  it('deja de marcar el campo en cuanto se completa', async () => {
    const fixture = await renderAdmin({ editor: new RejectingEditor() });

    fixture.componentInstance.add();
    await fixture.whenStable();
    await fixture.componentInstance.save();
    await fixture.whenStable();

    typeInto(controlsOf(rowsOf(fixture).at(-1) as HTMLElement)[NOMBRE], 'Tercera');
    await fixture.whenStable();

    expect(controlsOf(rowsOf(fixture).at(-1) as HTMLElement)[NOMBRE].classList).not.toContain(
      'invalid',
    );
  });

  it('ofrece subir un icono, limitado a los formatos que se aceptan', async () => {
    const fixture = await renderAdmin();
    const row = rowsOf(fixture)[0];
    const picker = row.querySelector<HTMLInputElement>('input[type="file"]');

    expect(picker).not.toBeNull();
    expect(picker?.getAttribute('accept')).toContain('image/svg+xml');
  });

  it('guarda el icono que cumple las medidas', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    await component.pickIcon(0, iconField(), fileInput(pngFile(ICON_MIN_PIXELS)));
    await fixture.whenStable();

    expect(component.items()[0]['icon']).toMatch(/^data:image\/png;base64,/);
    expect(component.iconRejection(0)).toBeNull();
  });

  it('no guarda el que se vería blando por chico, y dice por qué', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    await component.pickIcon(0, iconField(), fileInput(pngFile(ICON_MIN_PIXELS - 1)));
    await fixture.whenStable();

    expect(component.items()[0]['icon']).toBeUndefined();
    expect(component.iconRejection(0)).toContain(`${ICON_MIN_PIXELS}px`);
  });

  // Se mira el peso antes de leer el archivo: no hay por qué cargar en memoria
  // algo que ya se sabe que no entra.
  it('no guarda el que pesa de más, y dice por qué', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    await component.pickIcon(0, iconField(), fileInput(pngFile(ICON_MIN_PIXELS, ICON_MAX_BYTES)));
    await fixture.whenStable();

    expect(component.items()[0]['icon']).toBeUndefined();
    expect(component.iconRejection(0)).toContain('KB');
  });

  it('rechaza un formato que no se acepta', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;
    const gif = new File([new Uint8Array(40)], 'logo.gif', { type: 'image/gif' });

    await component.pickIcon(0, iconField(), fileInput(gif));
    await fixture.whenStable();

    expect(component.items()[0]['icon']).toBeUndefined();
    expect(component.iconRejection(0)).toContain('SVG');
  });

  it('avisa sólo en la fila donde se eligió el archivo', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    await component.pickIcon(1, iconField(), fileInput(pngFile(10)));
    await fixture.whenStable();

    expect(component.iconRejection(1)).not.toBeNull();
    expect(component.iconRejection(0)).toBeNull();
  });

  it('guarda el icono que se suelta sobre el campo', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    await component.dropIcon(0, iconField(), dropOf(pngFile(ICON_MIN_PIXELS)));
    await fixture.whenStable();

    expect(component.items()[0]['icon']).toMatch(/^data:image\/png;base64,/);
  });

  it('revisa lo que se suelta igual que lo que se elige', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    await component.dropIcon(0, iconField(), dropOf(pngFile(ICON_MIN_PIXELS - 1)));
    await fixture.whenStable();

    expect(component.items()[0]['icon']).toBeUndefined();
    expect(component.iconRejection(0)).toContain(`${ICON_MIN_PIXELS}px`);
  });

  it('resalta sólo el campo sobre el que se arrastra un archivo', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    component.dragOverIcon(1, dropOf(pngFile(ICON_MIN_PIXELS), 'dragover'));

    expect(component.isIconDropTarget(1)).toBeTrue();
    expect(component.isIconDropTarget(0)).toBeFalse();
  });

  it('no se ofrece a recibir un texto arrastrado', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;
    const transfer = new DataTransfer();
    transfer.setData('text/plain', 'logo');

    component.dragOverIcon(0, new DragEvent('dragover', { dataTransfer: transfer, cancelable: true }));

    expect(component.isIconDropTarget(0)).toBeFalse();
  });

  // Soltado fuera de un campo, el navegador abría el archivo en la pestaña y
  // se perdía el borrador sin publicar.
  it('no deja que un archivo soltado fuera del campo reemplace al panel', async () => {
    const fixture = await renderAdmin();
    const stray = dropOf(pngFile(ICON_MIN_PIXELS));

    document.body.dispatchEvent(stray);

    expect(stray.defaultPrevented).toBeTrue();
    expect(fixture.componentInstance.items()[0]['icon']).toBeUndefined();
  });

  it('deja sacar el icono ya puesto', async () => {
    const fixture = await renderAdmin();
    const component = fixture.componentInstance;

    await component.pickIcon(0, iconField(), fileInput(pngFile(ICON_MIN_PIXELS)));
    await fixture.whenStable();
    component.clearIcon(0, iconField());
    await fixture.whenStable();

    expect(component.items()[0]['icon']).toBe('');
  });

  it('señala el idioma al que le falta un campo, aunque no esté a la vista', async () => {
    const fixture = await renderAdmin({ editor: new RejectingEditor() });
    const component = fixture.componentInstance;

    component.add();
    await fixture.whenStable();
    await component.save();
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const langButtons = Array.from(host.querySelectorAll<HTMLElement>('.lang button'));

    expect(component.activeLang()).toBe('es');
    expect(langButtons.every((button) => button.classList.contains('blocked'))).toBeTrue();
  });
});
