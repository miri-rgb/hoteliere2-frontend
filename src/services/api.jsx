// ============================================================
// SERVICE API — Hôtelière 2.0
// Toutes les fonctions fetch vers le backend Laravel
// URL de base : http://localhost:8000
// ============================================================

const BASE_URL = 'http://localhost:8000/api';

// Headers communs pour toutes les requêtes
const getHeaders = (withAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (withAuth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Gestion centralisée des réponses
const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch {
    const err = new Error(`Réponse non-JSON (HTTP ${response.status} ${response.statusText})`);
    err.status = response.status;
    throw err;
  }
  if (!response.ok) {
    const err = new Error(data?.message || data?.error || `Erreur HTTP ${response.status}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
};

// ============================================================
// AUTHENTIFICATION
// ============================================================

export const login = (email, password) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  }).then(handleResponse);

export const register = (userData) =>
  fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  }).then(handleResponse);

export const loginWithGoogle = (googleData) =>
  fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(googleData),
  }).then(handleResponse);

export const getMe = () =>
  fetch(`${BASE_URL}/auth/me`, {
    headers: getHeaders(true),
  }).then(handleResponse);

export const logout = () =>
  fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: getHeaders(true),
  }).then(handleResponse);

// ============================================================
// HÔTELS (PUBLIC)
// ============================================================

export const getHotels = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== '' && val !== null && val !== undefined) query.append(key, val);
  });
  const qs = query.toString() ? `?${query.toString()}` : '';
  return fetch(`${BASE_URL}/hotels${qs}`, {
    headers: getHeaders(),
  }).then(handleResponse);
};

export const getHotel = async (id) => {
  try {
    return await fetch(`${BASE_URL}/hotels/${id}`, {
      headers: getHeaders(true),
    }).then(handleResponse);
  } catch (err) {
    // Fallback si le backend retourne 500 (ex: relation Avis.user non définie) :
    // on récupère l'hôtel depuis l'endpoint liste qui ne charge pas les avis.
    if (err.status === 500 || err.status === 422) {
      const listRes = await fetch(`${BASE_URL}/hotels?per_page=1000`, {
        headers: getHeaders(true),
      }).then(handleResponse);

      const hotels = Array.isArray(listRes?.data?.data) ? listRes.data.data
                   : Array.isArray(listRes?.data)       ? listRes.data
                   : Array.isArray(listRes)             ? listRes
                   : [];

      const hotel = hotels.find((h) => String(h.id) === String(id));
      if (hotel) return { data: hotel, _fallback: true };
    }
    throw err;
  }
};

export const comparerHotels = (ids) =>
  fetch(`${BASE_URL}/hotels/comparer?ids=${ids.join(',')}`, {
    headers: getHeaders(),
  }).then(handleResponse);

// ============================================================
// CHAMBRES (PUBLIC)
// ============================================================

export const getChambresDisponibles = async (dateArrivee, dateDepart, hotelId = null) => {
  const query = new URLSearchParams({ date_arrivee: dateArrivee, date_depart: dateDepart });
  if (hotelId) query.append('hotel_id', hotelId);
  return fetch(`${BASE_URL}/chambres/disponibles?${query.toString()}`, {
    headers: getHeaders(true),
  }).then(handleResponse);
};

// ============================================================
// RÉSERVATIONS (AUTH CLIENT)
// ============================================================

export const creerReservation = (reservationData) =>
  fetch(`${BASE_URL}/reservations`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(reservationData),
  }).then(handleResponse);

export const getMesReservations = () =>
  fetch(`${BASE_URL}/reservations/mes`, {
    headers: getHeaders(true),
  }).then(handleResponse);

export const annulerReservation = (id) =>
  fetch(`${BASE_URL}/reservations/${id}/annuler`, {
    method: 'PATCH',
    headers: getHeaders(true),
  }).then(handleResponse);

// ============================================================
// ADMIN
// ============================================================

export const getAdminUsers = () =>
  fetch(`${BASE_URL}/admin/users?per_page=1000`, {
    headers: getHeaders(true),
  }).then(handleResponse);

export const getAdminReservations = () =>
  fetch(`${BASE_URL}/admin/reservations?per_page=1000`, {
    headers: getHeaders(true),
  }).then(handleResponse);

export const getAdminHotels = () =>
  fetch(`${BASE_URL}/admin/hotels?per_page=1000`, {
    headers: getHeaders(true),
  }).then(handleResponse);

export const confirmerReservation = (id) =>
  fetch(`${BASE_URL}/admin/reservations/${id}/confirmer`, {
    method: 'PATCH',
    headers: getHeaders(true),
  }).then(handleResponse);

export const annulerReservationAdmin = (id) =>
  fetch(`${BASE_URL}/admin/reservations/${id}/annuler`, {
    method: 'PATCH',
    headers: getHeaders(true),
  }).then(handleResponse);

export const creerHotel = (data) =>
  fetch(`${BASE_URL}/admin/hotels`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const modifierHotel = (id, data) =>
  fetch(`${BASE_URL}/admin/hotels/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const supprimerHotel = (id) =>
  fetch(`${BASE_URL}/admin/hotels/${id}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  }).then(handleResponse);

export const getAdminChambres = () =>
  fetch(`${BASE_URL}/admin/chambres`, {
    headers: getHeaders(true),
  }).then(handleResponse);

export const creerChambre = (data) =>
  fetch(`${BASE_URL}/admin/chambres`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const modifierChambre = (id, data) =>
  fetch(`${BASE_URL}/admin/chambres/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const supprimerChambre = (id) =>
  fetch(`${BASE_URL}/admin/chambres/${id}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  }).then(handleResponse);

export const toggleUserActif = (id) =>
  fetch(`${BASE_URL}/admin/users/${id}/toggle-actif`, {
    method: 'PATCH',
    headers: getHeaders(true),
  }).then(handleResponse);

// ============================================================
// PAIEMENTS STRIPE
// ============================================================

export const getReservation = (id) =>
  fetch(`${BASE_URL}/reservations/${id}`, {
    headers: getHeaders(true),
  }).then(handleResponse);

export const creerPaiementIntent = (reservationId) =>
  fetch(`${BASE_URL}/paiements/intent`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ reservation_id: reservationId }),
  }).then(handleResponse);

export const confirmerPaiement = (reservationId, paymentIntentId) =>
  fetch(`${BASE_URL}/paiements/confirmer`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({
      reservation_id:    reservationId,
      payment_intent_id: paymentIntentId,
    }),
  }).then(handleResponse);

// ============================================================
// RECOMMANDATIONS (AUTH CLIENT)
// ============================================================

export const getRecommandations = () =>
  fetch(`${BASE_URL}/hotels/recommandations`, {
    headers: getHeaders(true),
  }).then(handleResponse);

export const soumettreAvis = (hotelId, data) =>
  fetch(`${BASE_URL}/hotels/${hotelId}/avis`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  }).then(handleResponse);

// ============================================================
// STATISTIQUES ADMIN
// ============================================================

export const getStatistiques = () =>
  fetch(`${BASE_URL}/admin/statistiques`, {
    headers: getHeaders(true),
  }).then(handleResponse);
