import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'clarityhub';

  tareas: {
    texto: string;
    prioridad: string;
    completado: boolean;
    fechaCreacion: number;
    fechaRecordatorio?: number;
    categoria: string;
    subtareas: { texto: string; completado: boolean }[];
    idTimeout?: any;
  }[] = [];

  iconosCategorias: { [key: string]: string } = {
    Trabajo: 'work',
    Personal: 'person',
    Estudio: 'school',
    Otros: 'category',
  };

  nuevaTarea: string = '';
  prioridadSeleccionada: string = 'media';
  filtro: string = 'todas';
  editandoIndex: number | null = null;
  textoEditado: string = '';
  orden: string = 'fecha';
  modoOscuro: boolean = false;
  nuevaFechaRecordatorio: string | null = null;
  nuevaHoraRecordatorio: string | null = null;
  categorias: string[] = ['Trabajo', 'Personal', 'Estudio', 'Otros'];
  categoriaSeleccionada: string = 'Otros';
  filtroCategoria: string = '';
  nuevasSubtareas: { [key: number]: string } = {};
  editandoSubtareas: { [key: number]: number | null } = {};
  textoEditadoSubtarea: string = '';
  mostrarInputSubtarea: boolean[] = [];
  campoActivo: { index: number; tipo: 'fecha' | 'categoria' } | null = null;
  mostrarFormulario: boolean = false;
  modoVista: 'lista' | 'cuadricula' = 'cuadricula';

  constructor() {
    this.cargarTareas();
    this.cargarPreferencias();
  }

  toggleCampo(index: number, tipo: 'fecha' | 'categoria') {
    if (this.campoActivo?.index === index && this.campoActivo?.tipo === tipo) {
      this.campoActivo = null;
    } else {
      this.campoActivo = { index, tipo };
    }
  }

  esCampoActivo(index: number, tipo: 'fecha' | 'categoria'): boolean {
    return this.campoActivo?.index === index && this.campoActivo?.tipo === tipo;
  }

  getTooltipFecha(fecha: number | undefined | null): string {
    return fecha ? new Date(fecha).toLocaleString() : 'Añadir recordatorio';
  }

  agregarTarea() {
    if (this.nuevaTarea.trim() !== '') {
      let fechaCompleta = undefined;

      if (this.nuevaFechaRecordatorio) {
        const fecha = new Date(this.nuevaFechaRecordatorio);

        // Si el usuario ha seleccionado una hora, la aplicamos
        if (this.nuevaHoraRecordatorio) {
          const [hora, minutos] = this.nuevaHoraRecordatorio
            .split(':')
            .map(Number);
          fecha.setHours(hora, minutos, 0, 0);
        }

        fechaCompleta = fecha.getTime(); // Convertimos la fecha a timestamp
      }

      this.tareas.push({
        texto: this.nuevaTarea,
        prioridad: this.prioridadSeleccionada,
        completado: false,
        fechaCreacion: Date.now(),
        fechaRecordatorio: fechaCompleta,
        categoria: this.categoriaSeleccionada || 'Otros',
        subtareas: [],
      });

      // Resetear los valores después de agregar la tarea
      this.nuevaTarea = '';
      this.nuevaFechaRecordatorio = null;
      this.nuevaHoraRecordatorio = null;
      this.categoriaSeleccionada = 'Otros';
      this.mostrarFormulario = false;
      this.guardarTareas();
      this.programarRecordatorio();
    }
  }

  eliminarTarea(index: number) {
    this.tareas.splice(index, 1);
    this.guardarTareas();
  }

  toggleCompletado(index: number) {
    this.tareas[index].completado = !this.tareas[index].completado;
    this.guardarTareas();
  }

  iniciarEdicion(index: number) {
    this.editandoIndex = index;
    this.textoEditado = this.tareas[index].texto;
  }

  guardarEdicion(index: number) {
    if (this.textoEditado.trim() !== '') {
      this.tareas[index].texto = this.textoEditado;
      this.editandoIndex = null;
      this.guardarTareas();
    }
  }

  cancelarEdicion() {
    this.editandoIndex = null;
  }

  guardarTareas() {
    localStorage.setItem('tareas', JSON.stringify(this.tareas));
  }

  cargarTareas() {
    const tareasGuardadas = localStorage.getItem('tareas');
    if (tareasGuardadas) {
      this.tareas = JSON.parse(tareasGuardadas);

      //Asegurar que todas las tareas tengan la propiedad "subtareas"
      this.tareas.forEach((tarea) => {
        if (!tarea.subtareas) {
          tarea.subtareas = []; //Si no tiene subtareas, se crea un array vacío
        }
      });
    }
  }

  getTareasFiltradas() {
    let tareasFiltradas = this.tareas;

    if (this.filtroCategoria) {
      tareasFiltradas = tareasFiltradas.filter(
        (t) => t.categoria === this.filtroCategoria
      );
    }

    if (this.filtro === 'pendientes') {
      return tareasFiltradas.filter((t) => !t.completado);
    } else if (this.filtro === 'completadas') {
      return tareasFiltradas.filter((t) => t.completado);
    }

    return tareasFiltradas;
  }

  getTareasOrdenadas() {
    let tareasFiltradas = this.getTareasFiltradas(); // Aplicar primero el filtro actual

    if (this.orden === 'prioridad') {
      return tareasFiltradas.sort((a, b) => this.ordenarPorPrioridad(a, b));
    } else if (this.orden === 'fecha') {
      return tareasFiltradas.sort((a, b) => b.fechaCreacion - a.fechaCreacion); // Orden descendente (más reciente primero)

      // return tareasFiltradas.sort((a, b) => a.fechaCreacion - b.fechaCreacion); // Orden ascendente (más antigua primero)
    }
    return tareasFiltradas;
  }

  ordenarPorPrioridad(
    a: { prioridad: string },
    b: { prioridad: string }
  ): number {
    const prioridades = { alta: 3, media: 2, baja: 1 };
    return (
      prioridades[b.prioridad as keyof typeof prioridades] -
      prioridades[a.prioridad as keyof typeof prioridades]
    );
  }

  toggleModoOscuro() {
    this.modoOscuro = !this.modoOscuro;
    document.body.classList.toggle('modo-oscuro', this.modoOscuro);
    this.guardarPreferencias();
  }

  guardarPreferencias() {
    localStorage.setItem('modoOscuro', JSON.stringify(this.modoOscuro));
  }

  cargarPreferencias() {
    const modoGuardado = localStorage.getItem('modoOscuro');
    this.modoOscuro = modoGuardado ? JSON.parse(modoGuardado) : false;
    document.body.classList.toggle('modo-oscuro', this.modoOscuro);
  }

  programarRecordatorio() {
    this.tareas.forEach((tarea) => {
      if (tarea.fechaRecordatorio && tarea.fechaRecordatorio > Date.now()) {
        if (tarea.idTimeout) {
          clearTimeout(tarea.idTimeout);
        }

        const tiempoEspera = tarea.fechaRecordatorio - Date.now();
        tarea.idTimeout = setTimeout(() => {
          this.mostrarNotificacion(tarea.texto);
        }, tiempoEspera);
      }
    });
  }

  eliminarFechaRecordatorio(index: number) {
    if (this.tareas[index].idTimeout) {
      clearTimeout(this.tareas[index].idTimeout);
      this.tareas[index].idTimeout = null;
    }
    this.tareas[index].fechaRecordatorio = undefined;
    this.guardarTareas();
  }

  mostrarNotificacion(mensaje: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('¡Recordatorio!', {
        body: `Tienes pendiente: ${mensaje}`,
      });
    } else if (
      'Notification' in window &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('¡Recordatorio!', {
            body: `Tienes pendiente: ${mensaje}`,
          });
        }
      });
    }
  }

  agregarSubtarea(index: number) {
    if (
      this.nuevasSubtareas[index] &&
      this.nuevasSubtareas[index].trim() !== ''
    ) {
      this.tareas[index].subtareas.push({
        texto: this.nuevasSubtareas[index],
        completado: false,
      });
      this.nuevasSubtareas[index] = ''; // Limpiar solo el input de la tarea actual
      this.guardarTareas();
    }
  }

  toggleSubtarea(tareaIndex: number, subIndex: number) {
    this.tareas[tareaIndex].subtareas[subIndex].completado =
      !this.tareas[tareaIndex].subtareas[subIndex].completado;
    this.guardarTareas();
  }

  eliminarSubtarea(tareaIndex: number, subIndex: number) {
    this.tareas[tareaIndex].subtareas.splice(subIndex, 1);
    this.guardarTareas();
  }

  iniciarEdicionSubtarea(tareaIndex: number, subIndex: number) {
    this.editandoSubtareas[tareaIndex] = subIndex; // Guardar el índice de la subtarea en edición solo para esta tarea
    this.textoEditadoSubtarea =
      this.tareas[tareaIndex].subtareas[subIndex].texto;
  }

  guardarEdicionSubtarea(tareaIndex: number, subIndex: number) {
    if (this.textoEditadoSubtarea.trim() !== '') {
      this.tareas[tareaIndex].subtareas[subIndex].texto =
        this.textoEditadoSubtarea;
      this.editandoSubtareas[tareaIndex] = null; // Salir del modo edición solo para esta tarea
      this.guardarTareas();
    }
  }

  cancelarEdicionSubtarea(tareaIndex: number) {
    this.editandoSubtareas[tareaIndex] = null; // Cancelar la edición solo para la tarea específica
  }

  cambiarFechaRecordatorio(index: number, event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input || !input.value) {
      this.tareas[index].fechaRecordatorio = undefined;
      this.guardarTareas();
      return;
    }

    const nuevaFecha = input.value;
    const tarea = this.tareas[index];

    if (tarea.idTimeout) {
      clearTimeout(tarea.idTimeout);
      tarea.idTimeout = null;
    }

    const timestamp = Date.parse(nuevaFecha);

    if (!isNaN(timestamp)) {
      tarea.fechaRecordatorio = timestamp;

      const tiempoRestante = timestamp - Date.now();
      if (tiempoRestante > 0) {
        tarea.idTimeout = setTimeout(() => {
          this.mostrarNotificacion(tarea.texto);
        }, tiempoRestante);
      }
    } else {
      tarea.fechaRecordatorio = undefined;
    }

    this.guardarTareas();
  }

  programarNotificacion(tarea: any) {
    if (!tarea.fechaRecordatorio) return;

    const tiempoRestante = tarea.fechaRecordatorio - Date.now();

    if (tarea.idTimeout) {
      clearTimeout(tarea.idTimeout);
    }

    if (tiempoRestante > 0) {
      tarea.idTimeout = setTimeout(() => {
        this.mostrarNotificacion(tarea.texto);
      }, tiempoRestante);
    }
  }

  toggleInputSubtarea(index: number) {
    this.mostrarInputSubtarea[index] = !this.mostrarInputSubtarea[index];
  }

  editarCategoria(index: number) {
    this.toggleCampo(index, 'categoria');
  }

  guardarCategoria(index: number) {
    this.campoActivo = null; // Sale del modo edición
    this.guardarTareas(); // Guarda los cambios en localStorage
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  toggleModoVista() {
    this.modoVista = this.modoVista === 'lista' ? 'cuadricula' : 'lista';
  }
}
