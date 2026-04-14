const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch baseline SAM and equilibrium data.
 */
export const fetchBaseline = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/baseline`);
    if (!response.ok) throw new Error('Failed to fetch baseline data');
    return await response.ok ? response.json() : null;
  } catch (error) {
    console.error('Error fetching baseline:', error);
    throw error;
  }
};

/**
 * Run a policy simulation.
 * @param {Object} shocks - { tax_rates, subsidies, labor_supply, capital_supply }
 */
export const runSimulation = async (shocks) => {
  try {
    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shocks }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Simulation failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Error running simulation:', error);
    throw error;
  }
};
