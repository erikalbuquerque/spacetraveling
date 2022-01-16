/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { NextApiRequest, NextApiResponse } from 'next';
import { Document } from '@prismicio/client/types/documents';
import { getPrismicClient } from '../../services/prismic';

function linkResolve(doc: Document): string {
  if (doc.type === 'posts') {
    return `/posts/${doc.uid}`;
  }
  return '/';
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<unknown> => {
  const { token: ref, documentId } = req.query;
  const redirectUrl = await getPrismicClient(req)
    .getPreviewResolver(String(ref), String(documentId))
    .resolve(linkResolve, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });

  res.writeHead(302, { location: `${redirectUrl}` });
  res.end();
  return null;
};
