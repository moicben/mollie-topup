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
      console.error('Error creating new payment in Supabase:', error);
      throw new Error('Failed to create new payment in database');
    }

    console.log('New payment created in Supabase, ID:', paymentNumber);
  } catch (error) {
    console.error('Error creating new payment in Supabase:', error);
    throw new Error('Failed to create new payment in Supabase');
  }
}