# A Shard Counter Demo in Croquet

This demo illustrates simple shared counter.

You can test it on your local computer by making a copy of dot-env-example:

   # cp dot-env-example .env.local

and then insert your Croquet development key obtained from https://croquet.io/keys into `.env.local`.

Then run: 

   # npm install
   # npm run dev

You can deploy it to your server by making a copy of dot-env-example:

   # cp dot-env-example .env.production

and insert your Croquet production key obtained from https://croquet.io/keys into `.env.production`.

Then run:
  
   # npm run build

and files generated in the `dist` directory to your server.

# Deployment to Croquet server

To deploy:

   # npm run deploy

This repo uses vite to build things. Values in .env.local are used for development and values in .env.production are used when `npm run build` is executed (and subsequently dist is copied to the deployment location.)
