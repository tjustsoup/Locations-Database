import SmartyStreetsSDK from "smartystreets-javascript-sdk";

type Row = {
  id: string;
  owner: string;
  address: string;
};

export default async function SmartyAPICall(rowData: any) {
  // Smarty API Request
  const SmartyStreetsCore = SmartyStreetsSDK.core;
  const Lookup = SmartyStreetsSDK.usStreet.Lookup;
  const authId = process.env.REACT_APP_SMARTY_AUTH_ID;
  const authToken = process.env.REACT_APP_SMARTY_AUTH_TOKEN;
  const credentials = new SmartyStreetsCore.StaticCredentials(
    authId as any,
    authToken as any
  );

  // SmartyStreets variables
  let client = SmartyStreetsCore.buildClient.usStreet(credentials);
  let batch = new SmartyStreetsCore.Batch();

  // Custom Variables
  let data: any = [];
  const maxBatchSize = 100;
  let count = 0;
  let totalCount = 0;

  /// Creating each lookup
  rowData.forEach(async (row: Row) => {
    totalCount++; // offset to ensure the final batch contains the remaining lookups
    count++; // offset to make batches of 100 lookups
    let lookup = new Lookup();
    lookup.inputId = row.id;
    lookup.street = row.address;
    lookup.addressee = row.owner;
    batch.add(lookup);

    // Creating each batch upon reaching offset (100) or final batch (remainders)
    if (count === maxBatchSize || totalCount === rowData.length) {
      data.push(batch); // adds this batch of lookups to an array
      batch = new SmartyStreetsCore.Batch(); // create new batch for next loop
      count = 0; // sets up count for next loop
    }
  });

  /// Adding properties to the whole batch
  //// Promise.all is key - it makes our return value be an array of our values, not promises
  return Promise.all(data.map(async (batch: any) => client.send(batch)));
}
