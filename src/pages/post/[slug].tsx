/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';

import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiUser } from 'react-icons/fi';
import { BiTimeFive } from 'react-icons/bi';

import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div>
        <p>Carregando...</p>
      </div>
    );
  }

  function formateDate(date: string) {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  }

  const postContentAsHTML = post.data.content
    .map(data => {
      return `
        <h1>${data.heading}</h1>
        ${RichText.asHtml(data.body)}
      `;
    })
    .join('');

  return (
    <>
      <Header className={styles.header} />
      <div className={styles.container}>
        <img src={post.data.banner.url} alt="" />
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.header}>
            <time>{formateDate(post.first_publication_date)}</time>
            <span>
              <FiUser color="#BBBBBB" />
              {post.data.author}
            </span>
            <span>
              <BiTimeFive color="#BBBBBB" />4 min
            </span>
          </div>
          <div
            className={styles.postContent}
            dangerouslySetInnerHTML={{
              __html: postContentAsHTML,
            }}
          />
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.banner', 'posts.author', 'posts.content'],
    }
  );

  const paths = response.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();

  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {
    fetch: ['posts.title', 'posts.banner', 'posts.author', 'posts.content'],
  });

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
