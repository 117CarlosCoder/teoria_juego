export async function fetchHealth() {
  const baseUrl = import.meta.env.VITE_MP_API_URL || window.location.origin;
  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) {
    throw new Error('No se pudo consultar health del backend multijugador');
  }
  return response.json();
}

export async function fetchRooms() {
  const baseUrl = import.meta.env.VITE_MP_API_URL || window.location.origin;
  const response = await fetch(`${baseUrl}/rooms`);
  if (!response.ok) {
    throw new Error('No se pudieron consultar las salas');
  }
  return response.json();
}
