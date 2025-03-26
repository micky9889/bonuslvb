import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
 
  ],
})
// Navigation guard to append ?nameUSER= if not present
router.beforeEach((to, from, next) => {
  const defaultName = 'guest';
  if (!to.query.nameUSER) {
    // Redirect to the same path with the query parameter
    return next({
      path: to.path,
      query: { ...to.query, nameUSER: defaultName||"" }, // You can set a default value like 'guest' instead of ''
    });
  }
  next(); // Proceed as normal if query parameter exists
});

export default router
