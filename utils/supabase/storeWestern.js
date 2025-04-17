import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function storeWestern(orderNumber, email, status, comment) {
  try {


    const { data, error } = await supabase
      .from('westerns')
      .insert([
        {
          order_id: orderNumber,
          status,
          email,
          comment: comment || '',
        },
      ]);

    if (error) {
      console.error('Error creating new western:', error);
      throw new Error('Failed to create new western in database');
    }

    console.log('New western created:', orderNumber);
  } catch (error) {
    console.error('Error creating new western:', error);
    throw new Error('Failed to create new western');
  }
}

// const orderNumber = '1234567890'; // Remplacez par le numéro de commande réel
// const email = 'eea@ga.fr'; // Remplacez par l'email réel
// const status = 'pending'; // Remplacez par le statut réel
// const comment = 'Test comment'; // Remplacez par le commentaire réel

// storeWestern(orderNumber, email, status, comment)