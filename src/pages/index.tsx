/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { useState } from 'react';

import Head from 'next/head';
import Link from 'next/link';

import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleNextPage() {
    const response = await fetch(nextPage);
    const prismicResponse = await response.json();

    setPosts([...posts, ...prismicResponse.results]);
    setNextPage(prismicResponse.next_page);
  }

  function formateDate(date: string) {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <Header className={styles.header} />

      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <time>
                    <FiCalendar color="#BBBBBB" />
                    {formateDate(post.first_publication_date)}
                  </time>
                  <span>
                    <FiUser color="#BBBBBB" />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
          <button
            className={styles.nextPageButton}
            type="button"
            onClick={handleNextPage}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 2,
    }
  );

  return {
    props: {
      postsPagination: response,
    },
  };
};
