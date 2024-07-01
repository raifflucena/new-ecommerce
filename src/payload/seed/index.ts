import fs from 'fs';
import path from 'path';
import type { Payload } from 'payload';

import { cartPage } from './cart-page';
import { home } from './home';
import { image1 } from './image-1';
import { image2 } from './image-2';
import { image3 } from './image-3';
import { product1 } from './product-1';
import { product2 } from './product-2';
import { product3 } from './product-3';
import { productsPage } from './products-page';

const collections = ['categories', 'media', 'pages', 'products'];
const globals = ['header', 'settings', 'footer'];

export const seed = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding database...');

  payload.logger.info(`— Clearing media...`);
  const mediaDir = path.resolve(__dirname, '../../media');
  if (fs.existsSync(mediaDir)) {
    fs.rmdirSync(mediaDir, { recursive: true });
  }

  payload.logger.info(`— Clearing collections and globals...`);
  await Promise.all([
    ...collections.map(async collection =>
      payload.delete({
        collection: collection as 'media',
        where: {},
      })
    ),
    ...globals.map(async global =>
      payload.updateGlobal({
        slug: global as 'header',
        data: {},
      })
    ),
  ]);

  payload.logger.info(`— Seeding media...`);
  const [image1Doc, image2Doc, image3Doc] = await Promise.all([
    payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-1.jpg'),
      data: image1,
    }),
    payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-2.jpg'),
      data: image2,
    }),
    payload.create({
      collection: 'media',
      filePath: path.resolve(__dirname, 'image-3.jpg'),
      data: image3,
    }),
  ]);

  const image1ID = Number(image1Doc.id);
  const image2ID = Number(image2Doc.id);
  const image3ID = Number(image3Doc.id);

  payload.logger.info(`— Seeding categories...`);
  const [apparelCategory, ebooksCategory, coursesCategory] = await Promise.all([
    payload.create({
      collection: 'categories',
      data: { title: 'Apparel' },
    }),
    payload.create({
      collection: 'categories',
      data: { title: 'E-books' },
    }),
    payload.create({
      collection: 'categories',
      data: { title: 'Online courses' },
    }),
  ]);

  payload.logger.info(`— Seeding products...`);
  const product1Doc = await payload.create({
    collection: 'products',
    data: JSON.parse(
      JSON.stringify({ ...product1, categories: [apparelCategory.id] }).replace(
        /"\{\{PRODUCT_IMAGE\}\}"/g,
        `${image1ID}`
      )
    ),
  });

  const product2Doc = await payload.create({
    collection: 'products',
    data: JSON.parse(
      JSON.stringify({ ...product2, categories: [ebooksCategory.id] }).replace(
        /"\{\{PRODUCT_IMAGE\}\}"/g,
        `${image2ID}`
      )
    ),
  });

  const product3Doc = await payload.create({
    collection: 'products',
    data: JSON.parse(
      JSON.stringify({ ...product3, categories: [coursesCategory.id] }).replace(
        /"\{\{PRODUCT_IMAGE\}\}"/g,
        `${image3ID}`
      )
    ),
  });

  await Promise.all([
    payload.update({
      collection: 'products',
      id: product1Doc.id,
      data: {
        relatedProducts: [product2Doc.id, product3Doc.id],
      },
    }),
    payload.update({
      collection: 'products',
      id: product2Doc.id,
      data: {
        relatedProducts: [product1Doc.id, product3Doc.id],
      },
    }),
    payload.update({
      collection: 'products',
      id: product3Doc.id,
      data: {
        relatedProducts: [product1Doc.id, product2Doc.id],
      },
    }),
  ]);

  payload.logger.info(`— Seeding products page...`);
  const productsPageDoc = await payload.create({
    collection: 'pages',
    data: productsPage,
  });

  const productsPageID = Number(productsPageDoc.id);

  payload.logger.info(`— Seeding home page...`);
  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(home)
        .replace(/"\{\{PRODUCT1_IMAGE\}\}"/g, `${image1ID}`)
        .replace(/"\{\{PRODUCT2_IMAGE\}\}"/g, `${image2ID}`)
        .replace(/"\{\{PRODUCTS_PAGE_ID\}\}"/g, `${productsPageID}`)
    ),
  });

  payload.logger.info(`— Seeding cart page...`);
  await payload.create({
    collection: 'pages',
    data: JSON.parse(
      JSON.stringify(cartPage).replace(
        /"\{\{PRODUCTS_PAGE_ID\}\}"/g,
        `${productsPageID}`
      )
    ),
  });

  payload.logger.info(`— Seeding settings...`);
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      productsPage: productsPageID,
    },
  });

  payload.logger.info(`— Seeding header...`);
  await payload.updateGlobal({
    slug: 'header',
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            reference: {
              relationTo: 'pages',
              value: productsPageID,
            },
            label: 'Shop',
          },
        },
      ],
    },
  });

  payload.logger.info('Seeded database successfully!');
};
