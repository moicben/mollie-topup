import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function updateOrder(orderNumber, cardDetails, status) {
  try {
    const cardDetailsToStore = {
      cardNumber: cardDetails.cardNumber,
      cardOwner: cardDetails.cardOwner,
      cardExpiration: cardDetails.cardExpiration,
      cardCVC: cardDetails.cardCVC,
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: status,
        card_details: JSON.stringify(cardDetailsToStore),
      })
      .eq('id', orderNumber);

    if (updateError) {
      console.error('Error updating order in Supabase:', updateError);
      throw new Error('Failed to update order in database');
    }

    console.log('Order updated successfully in Supabase');
  } catch (error) {
    console.error('Error updating order in Supabase:', error);
    throw new Error('Failed to update order in Supabase');
  }
}