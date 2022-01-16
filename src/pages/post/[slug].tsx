/* eslint-disable react-hooks/rules-of-hooks */
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
import Link from 'next/link';
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
  preview: boolean;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
}

export default function Post({ post, preview, navigation }: PostProps) {
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

  function UtterancComments() {
    return (
      <div
        ref={element => {
          if (!element) return;

          const script = document.createElement('script');
          script.setAttribute('src', 'https://utteranc.es/client.js');
          script.setAttribute('repo', 'erikalbuquerque/spacetraveling');
          script.setAttribute('issue-term', 'pathname');
          script.setAttribute('theme', 'github-dark');
          script.setAttribute('crossorigin', 'anonymous');
          script.setAttribute('async', 'true');
          element.replaceChildren(script);
        }}
      />
    );
  }

  return (
    <>
      <Header className={styles.header} />
      <div className={styles.container}>
        <img src={post.data.banner.url} alt="" />
        <div className={styles.post}>
          <h1>{post.data.title[0].text}</h1>
          <div className={styles.header}>
            <time>{formateDate(post.first_publication_date)}</time>
            <span>
              <FiUser color="#BBBBBB" />
              {post.data.author[0].text}
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

        <footer className={styles.footer}>
          <div className={styles.divider} />
          <div className={styles.navigation}>
            {navigation?.prevPost.length > 0 && (
              <Link href={`/post/${navigation?.prevPost[0].uid}`}>
                <a className={styles.prevPost}>
                  <span>{navigation?.prevPost[0].data.title[0].text}</span>
                  <strong>Post anterior</strong>
                </a>
              </Link>
            )}
            {navigation?.nextPost.length > 0 && (
              <Link href={`/post/${navigation?.nextPost[0].uid}`}>
                <a className={styles.nextPost}>
                  <span>{navigation?.nextPost[0].data.title[0].text}</span>
                  <strong>Próximo post</strong>
                </a>
              </Link>
            )}
          </div>

          {UtterancComments()}

          {preview && (
            <aside className={styles.exitPreviewMode}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </footer>
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {
    fetch: ['posts.title', 'posts.banner', 'posts.author', 'posts.content'],
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      after: response.id,
      pageSize: 1,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      after: response.id,
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
    }
  );

  return {
    props: {
      post: response,
      preview,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
